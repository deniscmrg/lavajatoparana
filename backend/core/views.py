# core/views.py
import os
import calendar
import datetime as dt
from datetime import date, timedelta
from io import BytesIO
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.db.models import Sum, Count, F, DecimalField, Q, DateTimeField
from django.db.models.functions import TruncDate, ExtractDay, Coalesce, ExtractMonth, ExtractYear

from django.http import HttpResponse
from django.utils import timezone
from django.utils.dateformat import DateFormat
from django.utils.timezone import now

# django-filters
import django_filters as df
from django_filters.rest_framework import DjangoFilterBackend

# DRF
from rest_framework import status, viewsets, filters as drf_filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

# ReportLab
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from .models import (
    Cliente, Veiculo, Servico, OrdemDeServico, ServicoOrdemServico,
    Fatura, FaturaOrdemServico, Caixa, LancamentoCaixa
)
from .serializers import (
    ClienteSerializer, VeiculoSerializer, ServicoSerializer, OrdemDeServicoSerializer,
    ServicoOrdemServicoSerializer, FaturaSerializer, CaixaSerializer, LancamentoCaixaSerializer
)

# ----------------------------------------------------------------------
# Exportar Fatura em PDF
# ----------------------------------------------------------------------
def exportar_fatura_pdf(request, pk):
    try:
        fatura = Fatura.objects.get(pk=pk)
    except Fatura.DoesNotExist:
        return HttpResponse(status=404)

    fatura_oss = FaturaOrdemServico.objects.filter(fatura=fatura).select_related('ordem_servico')
    ordens = [fos.ordem_servico for fos in fatura_oss]

    valor_total_fatura = 0
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    largura, altura = A4

    logo_path = os.path.join(settings.BASE_DIR, 'static', 'logo.jpeg')
    if os.path.exists(logo_path):
        logo = ImageReader(logo_path)
        orig_width, orig_height = logo.getSize()
        scale = (5 * cm) / orig_width
        scaled_width, scaled_height = orig_width * scale, orig_height * scale
        x_center = (largura - scaled_width) / 2
        y_top = altura - 2.5 * cm
        y_logo = y_top - scaled_height
        p.drawImage(logo, x_center, y_logo, width=scaled_width, height=scaled_height, preserveAspectRatio=True)
        y_atual = y_logo - 0.2 * cm
    else:
        p.setFont("Helvetica-Bold", 16)
        p.drawCentredString(largura / 2, altura - 3 * cm, "Lava Rápido Paraná")
        y_atual = altura - 4 * cm

    y = y_atual
    p.setFont("Helvetica-Bold", 14)
    p.drawString(2*cm, y, f"Fatura #{fatura.id}")
    y -= 0.8*cm

    p.setFont("Helvetica", 12)
    p.drawString(2*cm, y, f"Cliente: {fatura.cliente.nome}")
    y -= 0.6*cm
    p.drawString(2*cm, y, f"Competência: {fatura.competencia}")
    y -= 0.6*cm
    p.drawString(2*cm, y, f"Vencimento: {fatura.data_vencimento.strftime('%d/%m/%Y')}")
    y -= 0.6*cm
    p.drawString(2*cm, y, f"Status: {fatura.status}")
    y -= 1.0*cm

    p.setFont("Helvetica-Bold", 12)
    p.drawString(2*cm, y, "Detalhamento das Ordens:")
    y -= 0.7 * cm

    for ordem in ordens:
        if y < 4 * cm:
            p.showPage()
            y = altura - 3 * cm
            p.setFont("Helvetica", 11)

        data_formatada = DateFormat(ordem.data).format('d/m/Y')
        p.setFont("Helvetica-Bold", 11)
        p.drawString(2*cm, y, f"OS #{ordem.id} - DATA: {data_formatada}")
        y -= 0.5 * cm

        p.setFont("Helvetica", 11)
        p.drawString(2*cm, y, f"PLACA: {ordem.veiculo.placa} - MARCA: {ordem.veiculo.marca} - MODELO: {ordem.veiculo.modelo}")
        y -= 0.6 * cm

        p.setFont("Helvetica-Bold", 11)
        p.drawString(2*cm, y, "Serviço")
        p.drawString(10*cm, y, "Qtd")
        p.drawString(13*cm, y, "Valor Total")
        y -= 0.3 * cm
        p.line(2*cm, y, 18*cm, y)
        y -= 0.4 * cm

        total_os = 0
        servicos = ServicoOrdemServico.objects.filter(ordem_servico=ordem)
        p.setFont("Helvetica", 11)
        for s in servicos:
            if y < 3.5 * cm:
                p.showPage()
                y = altura - 3 * cm
                p.setFont("Helvetica", 11)

            valor_item = s.quantidade * s.valor
            total_os += valor_item
            p.drawString(2*cm, y, getattr(s.servico, "descricao", getattr(s.servico, "nome", "Serviço")))
            p.drawString(10*cm, y, str(s.quantidade))
            p.drawString(13*cm, y, f"R$ {valor_item:.2f}")
            y -= 0.5 * cm

        p.setFont("Helvetica-Bold", 11)
        p.drawRightString(18*cm, y, f"Total OS: R$ {total_os:.2f}")
        y -= 1 * cm
        valor_total_fatura += total_os

    if y < 3.5 * cm:
        p.showPage()
        y = altura - 3 * cm

    p.setFont("Helvetica-Bold", 12)
    p.drawRightString(18*cm, y, f"Valor Total da Fatura: R$ {valor_total_fatura:.2f}")

    p.showPage()
    p.save()
    buffer.seek(0)
    return HttpResponse(buffer, content_type='application/pdf')


# ----------------------------------------------------------------------
# Filters
# ----------------------------------------------------------------------
class FaturaFilter(df.FilterSet):
    """
    Query params:
      ?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD&status=pago|pendente|vencido
    """
    data_inicio = df.DateFilter(field_name="data_vencimento", lookup_expr="gte")
    data_fim    = df.DateFilter(field_name="data_vencimento", lookup_expr="lte")
    status      = df.CharFilter(method="filter_status")

    class Meta:
        model = Fatura
        fields = ["data_inicio", "data_fim", "status"]

    def filter_status(self, qs, name, value):
        v = (value or "").strip().lower()
        if v == "pago":
            return qs.filter(data_pagamento__isnull=False)
        if v in ("pendente", "aberto", "aberta"):
            return qs.filter(data_pagamento__isnull=True)
        if v == "vencido":
            return qs.filter(data_pagamento__isnull=True, data_vencimento__lt=date.today())
        return qs


class OrdemDeServicoFilter(df.FilterSet):
    """
    data: DateTimeField (timezone-aware)
    Recebe YYYY-MM-DD e converte para 00:00:00 / 23:59:59 na timezone atual.
    """
    data_inicio = df.DateFilter(method="filter_data_inicio")
    data_fim    = df.DateFilter(method="filter_data_fim")
    status      = df.CharFilter(field_name="status", lookup_expr="exact")

    class Meta:
        model = OrdemDeServico
        fields = ["status", "data_inicio", "data_fim"]

    def filter_data_inicio(self, qs, name, value):
        if not value:
            return qs
        tz = timezone.get_current_timezone()
        start_local = dt.datetime.combine(value, dt.time.min)
        start_aware = timezone.make_aware(start_local, tz)
        return qs.filter(data__gte=start_aware)

    def filter_data_fim(self, qs, name, value):
        if not value:
            return qs
        tz = timezone.get_current_timezone()
        end_local = dt.datetime.combine(value, dt.time.max)
        end_aware = timezone.make_aware(end_local, tz)
        return qs.filter(data__lte=end_aware)

# ----------------------------------------------------------------------
# LancamentoCaixa - Filters
# ----------------------------------------------------------------------
class LancamentoCaixaFilter(df.FilterSet):
    """
    Query params:
      ?search=<texto>
      ?tipo=entrada|saida
      ?data_inicio=YYYY-MM-DD
      ?data_fim=YYYY-MM-DD
      ?categoria=<str>
      ?forma_pagamento=<str>
      ?ordering=campo|-campo
      ?page=1
    """
    data_inicio     = df.DateFilter(field_name="data", lookup_expr="gte")
    data_fim        = df.DateFilter(field_name="data", lookup_expr="lte")
    tipo            = df.CharFilter(field_name="tipo", lookup_expr="iexact")
    categoria       = df.CharFilter(field_name="categoria", lookup_expr="iexact")
    forma_pagamento = df.CharFilter(field_name="forma_pagamento", lookup_expr="iexact")

    class Meta:
        model  = LancamentoCaixa
        fields = ["tipo", "data_inicio", "data_fim", "categoria", "forma_pagamento"]


# ----------------------------------------------------------------------
# ViewSets
# ----------------------------------------------------------------------
class FaturaViewSet(viewsets.ModelViewSet):
    queryset = Fatura.objects.all()
    serializer_class = FaturaSerializer

    filter_backends  = [drf_filters.SearchFilter, DjangoFilterBackend, drf_filters.OrderingFilter]
    filterset_class  = FaturaFilter
    search_fields    = ["cliente__nome"]
    ordering_fields  = ["id", "cliente__nome", "data_vencimento", "data_pagamento"]
    ordering         = ["-data_vencimento"]

    def get_queryset(self):
        qs = super().get_queryset()
        # Filtro opcional por ano/mês (mantido)
        ano = self.request.query_params.get("ano")
        mes = self.request.query_params.get("mes")
        if ano and mes:
            qs = qs.filter(data_vencimento__year=ano, data_vencimento__month=mes)
        return qs

    @action(detail=False, methods=["post"], url_path="gerar")
    def gerar_faturas(self, request):
        try:
            competencia = request.data.get("competencia")
            cliente_id  = request.data.get("cliente_id")

            if not competencia or len(competencia) != 6:
                return Response({"erro": "Competência inválida. Use MMAAAA."}, status=400)

            mes = int(competencia[:2])
            ano = int(competencia[2:])
            data_inicio = date(ano, mes, 1)
            ultimo_dia  = calendar.monthrange(ano, mes)[1]
            data_fim    = date(ano, mes, ultimo_dia)

            os_usadas_ids = FaturaOrdemServico.objects.values_list("ordem_servico_id", flat=True)
            os_filtradas = OrdemDeServico.objects.filter(
                forma_pagamento="faturar",
                cliente__tipo="lojista",
                data__date__range=(data_inicio, data_fim),
            ).exclude(id__in=os_usadas_ids)

            if cliente_id:
                os_filtradas = os_filtradas.filter(cliente__id=cliente_id)

            clientes_ids = os_filtradas.values_list("cliente", flat=True).distinct()
            resultados = []

            for cid in clientes_ids:
                with transaction.atomic():
                    cliente    = Cliente.objects.get(id=cid)
                    os_cliente = os_filtradas.filter(cliente=cliente)

                    fatura = Fatura.objects.create(
                        cliente=cliente,
                        data_vencimento=data_fim,
                        competencia=competencia,
                    )

                    for os in os_cliente:
                        FaturaOrdemServico.objects.create(
                            fatura=fatura,
                            ordem_servico=os
                        )

                    resultados.append({
                        "cliente": cliente.nome,
                        "fatura_id": fatura.id,
                        "ordens": os_cliente.count()
                    })

            return Response({"faturas_criadas": resultados}, status=201)

        except Exception as e:
            import traceback; traceback.print_exc()
            return Response({"erro": str(e)}, status=500)

    @action(detail=True, methods=["post"], url_path="receber")
    def receber_fatura(self, request, pk=None):
        try:
            fatura = self.get_object()
            forma_pagamento = request.data.get("forma_pagamento")

            if (fatura.status or "").lower() == "paga":
                return Response({"erro": "Fatura já está paga."}, status=400)
            if not forma_pagamento:
                return Response({"erro": "Forma de pagamento é obrigatória."}, status=400)

            origem_base = rf"^FATURA #{fatura.id} / OS #"
            if LancamentoCaixa.objects.filter(origem__regex=origem_base).exists():
                return Response({"erro": "Fatura já foi recebida no caixa."}, status=400)

            with transaction.atomic():
                fatura.data_pagamento  = now().date()
                fatura.forma_pagamento = forma_pagamento
                fatura.save()  # status é @property

                ordens = OrdemDeServico.objects.filter(faturaordemservico__fatura=fatura)
                for os in ordens:
                    valor_total = ServicoOrdemServico.objects.filter(
                        ordem_servico=os
                    ).aggregate(total=Sum("valor"))["total"] or 0

                    LancamentoCaixa.objects.create(
                        data=now().date(),
                        valor=valor_total,
                        origem=f"FATURA #{fatura.id} / OS #{os.id}",
                        tipo="entrada",
                        descricao=f"{os.veiculo.placa} - {os.cliente.nome}",
                        categoria="serviços",
                        forma_pagamento=forma_pagamento,
                    )

            return Response({"msg": "Fatura recebida com sucesso."})
        except Exception as e:
            import traceback; traceback.print_exc()
            return Response({"erro": str(e)}, status=500)


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    filter_backends = [drf_filters.SearchFilter, DjangoFilterBackend, drf_filters.OrderingFilter]

    search_fields   = ['nome', 'celular', 'email', 'tipo']
    ordering_fields = ['id', 'nome', 'celular', 'email', 'tipo']
    ordering        = ['nome']

    def get_queryset(self):
        qs = super().get_queryset()
        tipo = self.request.query_params.get('tipo')
        if tipo:
            qs = qs.filter(tipo=tipo)
        return qs


class VeiculoViewSet(viewsets.ModelViewSet):
    queryset = Veiculo.objects.all()
    serializer_class = VeiculoSerializer
    filter_backends = [drf_filters.SearchFilter, DjangoFilterBackend, drf_filters.OrderingFilter]

    search_fields   = ['placa', 'marca', 'modelo', 'cliente__nome']
    ordering_fields = ['placa', 'marca', 'modelo', 'cliente__nome']
    ordering        = ['placa']


class ServicoViewSet(viewsets.ModelViewSet):
    queryset = Servico.objects.all()
    serializer_class = ServicoSerializer
    permission_classes = [IsAuthenticated]


class OrdemDeServicoViewSet(viewsets.ModelViewSet):
    queryset = OrdemDeServico.objects.all()
    serializer_class = OrdemDeServicoSerializer

    filter_backends  = [drf_filters.SearchFilter, DjangoFilterBackend, drf_filters.OrderingFilter]
    search_fields    = ['cliente__nome', 'veiculo__placa']
    ordering_fields  = ['id', 'data', 'status', 'forma_pagamento']
    ordering         = ['-data']
    filterset_class  = OrdemDeServicoFilter

    def get_queryset(self):
        qs = super().get_queryset()
        ano = self.request.query_params.get('ano')
        mes = self.request.query_params.get('mes')
        cliente_id = self.request.query_params.get('cliente_id')

        if ano and mes:
            qs = qs.filter(data__year=ano, data__month=mes)
        if cliente_id:
            qs = qs.filter(cliente_id=cliente_id)
        return qs

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        LancamentoCaixa.objects.filter(origem__icontains=f'OS #{instance.id}').delete()
        Caixa.objects.filter(ordem_servico=instance).delete()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='total')
    def total_ordens(self, request):
        competencia = request.GET.get('competencia')
        cliente_id  = request.GET.get('cliente_id')

        if not competencia or len(competencia) != 6:
            return Response({'erro': 'Competência inválida.'}, status=400)

        try:
            mes = int(competencia[:2])
            ano = int(competencia[2:])
            data_inicio = dt.date(ano, mes, 1)
            data_fim    = dt.date(ano, mes, calendar.monthrange(ano, mes)[1])
        except Exception:
            return Response({'erro': 'Erro ao interpretar a competência.'}, status=400)

        ordens = OrdemDeServico.objects.filter(
            forma_pagamento='faturar',
            cliente__tipo='lojista',
            data__date__gte=data_inicio,
            data__date__lte=data_fim
        )

        if cliente_id:
            ordens = ordens.filter(cliente__id=cliente_id)

        total = ServicoOrdemServico.objects.filter(ordem_servico__in=ordens).aggregate(
            total=Sum('valor')
        )['total'] or 0

        return Response({'total': total})


class ServicoOrdemServicoViewSet(viewsets.ModelViewSet):
    queryset = ServicoOrdemServico.objects.all()
    serializer_class = ServicoOrdemServicoSerializer


# ----------------------------------------------------------------------
# Caixa - Filters
# ----------------------------------------------------------------------
class CaixaFilter(df.FilterSet):
    """
    Query params:
      ?tipo=entrada|saida
      ?data_inicio=YYYY-MM-DD
      ?data_fim=YYYY-MM-DD
    """
    data_inicio = df.DateFilter(field_name="data", lookup_expr="gte")
    data_fim    = df.DateFilter(field_name="data", lookup_expr="lte")
    tipo        = df.CharFilter(field_name="tipo", lookup_expr="iexact")

    class Meta:
        model  = Caixa
        # Use SOMENTE nomes de campos do model Caixa aqui:
        fields = ["tipo", "data_inicio", "data_fim"]
        # Se o model Caixa tiver estes campos, pode liberar:
        # fields = ["tipo", "data_inicio", "data_fim", "categoria", "forma_pagamento"]



class CaixaViewSet(viewsets.ModelViewSet):
    queryset = Caixa.objects.all()
    serializer_class = CaixaSerializer

    filter_backends  = [drf_filters.SearchFilter, DjangoFilterBackend, drf_filters.OrderingFilter]
    filterset_class  = CaixaFilter

    # Atenção: inclua aqui APENAS campos que existem no model Caixa
    # Se o model possuir 'origem', 'descricao', 'categoria', 'forma_pagamento', pode reativar abaixo.
    search_fields    = []  # ex.: ["origem", "descricao", "categoria"]
    ordering_fields  = ["id", "data", "valor", "tipo"]  # acrescente outros campos reais do model aqui
    ordering         = ["-data"]

    def get_queryset(self):
        qs = super().get_queryset()
        # Mantém compat ano/mês já usada em outras views
        ano = self.request.query_params.get('ano')
        mes = self.request.query_params.get('mes')
        if ano and mes:
            qs = qs.filter(data__year=ano, data__month=mes)
        return qs


# ----------------------------------------------------------------------
# LancamentoCaixa - ViewSet (com resumo)
# ----------------------------------------------------------------------
class LancamentoCaixaViewSet(viewsets.ModelViewSet):
    queryset = LancamentoCaixa.objects.all()  # sem .order_by aqui
    serializer_class = LancamentoCaixaSerializer
    permission_classes = [IsAuthenticated]

    # Filtros / Busca / Ordenação
    filter_backends  = [DjangoFilterBackend, drf_filters.SearchFilter, drf_filters.OrderingFilter]
    filterset_class  = LancamentoCaixaFilter

    # Busca textual (?search=)
    search_fields    = ["origem", "descricao", "categoria"]  # campos existem no model

    # Ordenação (?ordering=campo|-campo)
    ordering_fields  = ["id", "data", "valor", "origem", "descricao", "categoria", "tipo", "forma_pagamento"]
    ordering         = ["-data"]  # padrão

    @action(detail=False, methods=["get"], url_path="resumo")
    def resumo(self, request):
        """
        Agrega os lançamentos filtrados por tipo e forma de pagamento.
        Reaproveita TODOS os filtros/busca/ordenação aplicáveis via ?params.
        Retorna:
          - entradas: { forma: total }
          - saidas:   { forma: total }
          - total_entradas, total_saidas, saldo
        """
        qs = self.filter_queryset(self.get_queryset())

        # agrega por tipo e forma_pagamento
        agg = (
            qs.values("tipo", "forma_pagamento")
              .annotate(total=Sum("valor"))
              .order_by("tipo", "forma_pagamento")
        )

        entradas, saidas = {}, {}
        for row in agg:
            total = row["total"] or 0
            if not total:
                continue
            forma = row["forma_pagamento"] or "Não informado"
            if (row["tipo"] or "").lower() == "entrada":
                entradas[forma] = float(total) + float(entradas.get(forma, 0))
            elif (row["tipo"] or "").lower() == "saida":
                saidas[forma] = float(total) + float(saidas.get(forma, 0))

        total_entradas = round(sum(entradas.values()), 2)
        total_saidas   = round(sum(saidas.values()), 2)
        saldo          = round(total_entradas - total_saidas, 2)

        return Response({
            "entradas": entradas,
            "saidas": saidas,
            "total_entradas": total_entradas,
            "total_saidas": total_saidas,
            "saldo": saldo,
        })


class ServicosPorOrdemAPIView(APIView):
    def get(self, request, ordem_id):
        servicos = ServicoOrdemServico.objects.filter(ordem_servico_id=ordem_id)
        serializer = ServicoOrdemServicoSerializer(servicos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PerfilUsuarioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.is_superuser:
            perfil = 'admin'
        elif request.user.groups.filter(name='operador').exists():
            perfil = 'operador'
        else:
            perfil = 'usuario'
        return Response({'perfil': perfil})


class DashboardResumoAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            mes = int(request.query_params.get('mes') or date.today().month)
            ano = int(request.query_params.get('ano') or date.today().year)
        except ValueError:
            return Response({"detail": "Parâmetros inválidos."}, status=400)

        if not (1 <= mes <= 12) or not (2000 <= ano <= 2100):
            return Response({"detail": "Parâmetros fora do intervalo."}, status=400)

        # Datas base (Date)
        primeiro_dia = date(ano, mes, 1)
        ultimo_dia   = date(ano, mes, calendar.monthrange(ano, mes)[1])
        dias_no_mes  = calendar.monthrange(ano, mes)[1]

        # -------------------------
        # ENTRADAS (Caixa) por dia
        # -------------------------
        entradas_qs = (
            LancamentoCaixa.objects
            .filter(tipo='entrada', data__range=(primeiro_dia, ultimo_dia))
            .exclude(data__isnull=True)
            .annotate(dia=ExtractDay('data'))  # 1..31
            .values('dia')
            .annotate(total=Sum('valor'))
            .order_by('dia')
        )
        mapa_entradas = {
            int(r['dia']): float(r['total'] or 0)
            for r in entradas_qs
            if r['dia'] is not None
        }

        # --------------------------------------------
        # OS FINALIZADAS por dia (TZ-aware, MySQL-safe)
        # --------------------------------------------
        # intervalo [início do mês, início do próximo mês) na sua TZ
        tz = timezone.get_current_timezone()
        inicio_local = dt.datetime.combine(primeiro_dia, dt.time.min)
        prox_mes_date = (primeiro_dia.replace(day=28) + dt.timedelta(days=4)).replace(day=1)
        fim_local = dt.datetime.combine(prox_mes_date, dt.time.min)

        inicio = timezone.make_aware(inicio_local, tz)
        fim    = timezone.make_aware(fim_local, tz)

        # pega só as DATAS (datetime) e agrega em Python (evita bugs de função no MySQL)
        datas_fech = list(
            OrdemDeServico.objects
            .filter(status__iexact='finalizada',
                    data_fechamento__gte=inicio,
                    data_fechamento__lt=fim)
            .values_list('data_fechamento', flat=True)
        )
        datas_sem_fech = list(
            OrdemDeServico.objects
            .filter(status__iexact='finalizada',
                    data_fechamento__isnull=True,
                    data__gte=inicio,
                    data__lt=fim)
            .values_list('data', flat=True)
        )

        mapa_os = {}
        for dtv in datas_fech + datas_sem_fech:
            if not dtv:
                continue
            dia_local = timezone.localtime(dtv, tz).day  # 1..31
            mapa_os[dia_local] = mapa_os.get(dia_local, 0) + 1

        total_os_finalizadas = sum(mapa_os.values())

        # -------------------------
        # Monta série do gráfico
        # -------------------------
        grafico = [
            {
                "dia": f"{i:02d}",
                "valor": round(mapa_entradas.get(i, 0.0), 2),
                "quantidade": mapa_os.get(i, 0),
            }
            for i in range(1, dias_no_mes + 1)
        ]

        # -------------------------
        # Painéis (abertas / faturas)
        # -------------------------
        # OS abertas no mês (mesmo intervalo aware)
        os_abertas_qs = (
            OrdemDeServico.objects
            .filter(status='aberta', data__gte=inicio, data__lt=fim)
            .select_related('veiculo')
            .order_by('-data')[:200]
        )
        os_abertas = [
            {"id": os.id, "placa": getattr(os.veiculo, 'placa', None), "data": os.data}
            for os in os_abertas_qs
        ]

        # Faturas abertas no mês por vencimento (DateField)
        faturas_qs = (
            Fatura.objects
            .filter(data_vencimento__range=(primeiro_dia, ultimo_dia),
                    data_pagamento__isnull=True)
            .select_related('cliente')
            .order_by('data_vencimento')[:500]
        )
        faturas_abertas = [
            {"id": f.id, "cliente_nome": getattr(f.cliente, 'nome', None), "data_vencimento": f.data_vencimento}
            for f in faturas_qs
        ]

        return Response({
            "grafico": grafico,
            "os_abertas": os_abertas,
            "faturas_abertas": faturas_abertas,
            "total_os_finalizadas": total_os_finalizadas,  # útil p/ validar no front
        })
