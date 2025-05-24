from reportlab.lib.utils import ImageReader
from django.utils.dateformat import DateFormat
from django.conf import settings
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
from django.db import transaction
from django.shortcuts import render
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from django.utils.timezone import now
from django.db.models import Sum
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
import calendar
import os
from django.http import HttpResponse
from io import BytesIO
from datetime import date 
from .models import (
    FaturaOrdemServico, 
    Cliente, 
    Veiculo, 
    Servico, 
    OrdemDeServico, 
    ServicoOrdemServico, 
    Fatura, 
    Caixa, 
    LancamentoCaixa)
from .serializers import (
    ClienteSerializer,
    VeiculoSerializer,
    ServicoSerializer,
    OrdemDeServicoSerializer,
    ServicoOrdemServicoSerializer,
    FaturaSerializer,
    CaixaSerializer, 
    LancamentoCaixaSerializer
)

#exportar PDF
from io import BytesIO
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from django.utils.dateformat import DateFormat
import os

from .models import Fatura, FaturaOrdemServico, ServicoOrdemServico


def exportar_fatura_pdf(request, pk):
    try:
        fatura = Fatura.objects.get(pk=pk)
    except Fatura.DoesNotExist:
        return HttpResponse(status=404)

    # Ordens vinculadas à fatura
    fatura_oss = FaturaOrdemServico.objects.filter(fatura=fatura).select_related('ordem_servico')
    ordens = [fos.ordem_servico for fos in fatura_oss]

    # Valor total da fatura
    valor_total_fatura = 0

    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    largura, altura = A4

       
    logo_path = os.path.join(settings.BASE_DIR, 'static', 'logo.jpeg')

    if os.path.exists(logo_path):
        logo = ImageReader(logo_path)
        orig_width, orig_height = logo.getSize()

        max_width = 5 * cm
        scale = max_width / orig_width
        scaled_width = orig_width * scale
        scaled_height = orig_height * scale

        x_center = (largura - scaled_width) / 2
        y_top = altura - 2.5 * cm
        y_logo = y_top - scaled_height

        p.drawImage(logo, x_center, y_logo, width=scaled_width, height=scaled_height, preserveAspectRatio=True)

        y_atual = y_logo - 0.2 * cm
    else:
        p.setFont("Helvetica-Bold", 16)
        p.drawCentredString(largura / 2, altura - 3 * cm, "Lava Rápido Paraná")
        y_atual = altura - 4 * cm  # se não tiver logo, define o y inicial padrão
    
   
    # Começa com o y_atual logo abaixo do logo
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
    y -= 1.0*cm  # deixa mais espaço antes das OSs

    p.setFont("Helvetica-Bold", 12)
    p.drawString(2*cm, y, "Detalhamento das Ordens:")
    y -= 0.7 * cm

    # Conteúdo por OS
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

        # Cabeçalho da tabela
        p.setFont("Helvetica-Bold", 11)
        p.drawString(2*cm, y, "Serviço")
        p.drawString(10*cm, y, "Qtd")
        p.drawString(13*cm, y, "Valor Total")
        y -= 0.3 * cm
        p.line(2*cm, y, 18*cm, y)
        y -= 0.4 * cm

        # Serviços da OS
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
            p.drawString(2*cm, y, s.servico.descricao)
            p.drawString(10*cm, y, str(s.quantidade))
            p.drawString(13*cm, y, f"R$ {valor_item:.2f}")
            y -= 0.5 * cm

        # Total da OS
        p.setFont("Helvetica-Bold", 11)
        p.drawRightString(18*cm, y, f"Total OS: R$ {total_os:.2f}")
        y -= 1 * cm

        valor_total_fatura += total_os

    # Total da fatura ao final
    if y < 3.5 * cm:
        p.showPage()
        y = altura - 3 * cm

    p.setFont("Helvetica-Bold", 12)
    p.drawRightString(18*cm, y, f"Valor Total da Fatura: R$ {valor_total_fatura:.2f}")
    y -= 1 * cm


    p.showPage()
    p.save()
    buffer.seek(0)

    return HttpResponse(buffer, content_type='application/pdf')


#######3

class FaturaViewSet(viewsets.ModelViewSet):
    queryset = Fatura.objects.all()
    serializer_class = FaturaSerializer

    @action(detail=False, methods=['post'], url_path='gerar')
    def gerar_faturas(self, request):
        try:
            print('>>>>> GERANDO FATURAS <<<<<')
            competencia = request.data.get('competencia')
            cliente_id = request.data.get('cliente_id')

            if not competencia or len(competencia) != 6:
                return Response({'erro': 'Competência inválida. Use o formato MMAAAA.'}, status=400)

            mes = int(competencia[:2])
            ano = int(competencia[2:])
            data_inicio = datetime(ano, mes, 1)
            ultimo_dia = calendar.monthrange(ano, mes)[1]
            data_fim = datetime(ano, mes, ultimo_dia)

            os_usadas_ids = FaturaOrdemServico.objects.values_list('ordem_servico_id', flat=True)

            os_queryset = OrdemDeServico.objects.filter(
                forma_pagamento='faturar',
                cliente__tipo='lojista',
                data__date__gte=data_inicio.date(),
                data__date__lte=data_fim.date()
            ).exclude(id__in=os_usadas_ids)

            if cliente_id:
                os_queryset = os_queryset.filter(cliente__id=cliente_id)

            clientes_ids = os_queryset.values_list('cliente', flat=True).distinct()
            resultados = []

            for cid in clientes_ids:
                with transaction.atomic():
                    cliente = Cliente.objects.get(id=cid)
                    os_cliente = os_queryset.filter(cliente=cliente)

                    fatura = Fatura.objects.create(
                        cliente=cliente,
                        data_vencimento=data_fim,
                        competencia=competencia
                    )

                    for os in os_cliente:
                        FaturaOrdemServico.objects.create(
                            fatura=fatura,
                            ordem_servico=os
                        )

                    resultados.append({
                        'cliente': cliente.nome,
                        'fatura_id': fatura.id,
                        'ordens': os_cliente.count()
                    })

            return Response({'faturas_criadas': resultados}, status=201)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'erro': str(e)}, status=500)

    @action(detail=True, methods=['post'], url_path='receber')
    def receber_fatura(self, request, pk=None):
        try:
            fatura = self.get_object()
            forma_pagamento = request.data.get('forma_pagamento')           

            if fatura.status.lower() == 'pago':
                return Response({'erro': 'Fatura já está paga.'}, status=400)

            forma_pagamento = request.data.get('forma_pagamento')
            if not forma_pagamento:
                return Response({'erro': 'Forma de pagamento é obrigatória.'}, status=400)
            
                       
            # VERIFICA SE JÁ EXISTE LANÇAMENTO COM ORIGEM QUE COMEÇA COM "FATURA #{id}"
            origem_base = rf"^FATURA #{fatura.id} / OS #"
            if LancamentoCaixa.objects.filter(origem__regex=origem_base).exists():
                return Response({'erro': 'Fatura já foi recebida e lançada no caixa.'}, status=400)
            
           

            with transaction.atomic():
                fatura.data_pagamento = now().date()
                fatura.forma_pagamento = forma_pagamento
                # fatura.status = 'pago'
                fatura.save()

                ordens = OrdemDeServico.objects.filter(faturaordemservico__fatura=fatura)

                for os in ordens:
                    valor_total = ServicoOrdemServico.objects.filter(ordem_servico=os).aggregate(
                        total=Sum('valor')
                    )['total'] or 0

                    LancamentoCaixa.objects.create(
                        data=now().date(),
                        valor=valor_total,
                        origem=f"FATURA #{fatura.id} / OS #{os.id}",
                        tipo='entrada',
                        descricao=f"{os.veiculo.placa} - {os.cliente.nome}",
                        categoria='serviços',
                        forma_pagamento=forma_pagamento
                    )

            return Response({'msg': 'Fatura recebida com sucesso.'})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'erro': str(e)}, status=500)

   
class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['celular']

class VeiculoViewSet(viewsets.ModelViewSet):
    queryset = Veiculo.objects.all()
    serializer_class = VeiculoSerializer

class ServicoViewSet(viewsets.ModelViewSet):
    queryset = Servico.objects.all()
    serializer_class = ServicoSerializer
    permission_classes = [IsAuthenticated]

class OrdemDeServicoViewSet(viewsets.ModelViewSet):
    queryset = OrdemDeServico.objects.all()
    serializer_class = OrdemDeServicoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']  # Habilita filtro ?status=aberta

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Exclui lançamentos de caixa relacionados pelo campo origem
        LancamentoCaixa.objects.filter(origem__icontains=f'OS #{instance.id}').delete()
        # Exclui lançamentos de caixa que estão ligados pelo campo ordem_servico em Caixa (caso existam)
        Caixa.objects.filter(ordem_servico=instance).delete()
        # Exclui a Ordem de Serviço
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='total')
    def total_ordens(self, request):
        competencia = request.GET.get('competencia')
        cliente_id = request.GET.get('cliente_id')

        if not competencia or len(competencia) != 6:
            return Response({'erro': 'Competência inválida.'}, status=400)

        try:
            mes = int(competencia[:2])
            ano = int(competencia[2:])
            data_inicio = datetime(ano, mes, 1)
            data_fim = datetime(ano, mes, calendar.monthrange(ano, mes)[1])
        except:
            return Response({'erro': 'Erro ao interpretar a competência.'}, status=400)

        ordens = OrdemDeServico.objects.filter(
            forma_pagamento='faturar',
            cliente__tipo='lojista',
            data__date__gte=data_inicio.date(),
            data__date__lte=data_fim.date()
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

class CaixaViewSet(viewsets.ModelViewSet):
    queryset = Caixa.objects.all()
    serializer_class = CaixaSerializer
    
class LancamentoCaixaViewSet(viewsets.ModelViewSet):
    queryset = LancamentoCaixa.objects.all().order_by('-data')
    serializer_class = LancamentoCaixaSerializer
    
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

