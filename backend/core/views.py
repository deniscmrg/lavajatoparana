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
import calendar
from .models import (
    Fatura, 
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

class FaturaViewSet(viewsets.ModelViewSet):
    queryset = Fatura.objects.all()
    serializer_class = FaturaSerializer  # ou use serializers.ModelSerializer direto

    @action(detail=False, methods=['post'], url_path='gerar')
    def gerar_faturas(self, request):
        print('>>>>> GERANDO FATURAS <<<<<')
        competencia = request.data.get('competencia')
        cliente_id = request.data.get('cliente_id')

        if not competencia or len(competencia) != 6:
            return Response({'erro': 'Competência inválida. Use o formato MMAAAA.'}, status=400)

        try:
            mes = int(competencia[:2])
            ano = int(competencia[2:])
            data_inicio = datetime(ano, mes, 1)
            ultimo_dia = calendar.monthrange(ano, mes)[1]
            data_fim = datetime(ano, mes, ultimo_dia)
        except:
            return Response({'erro': 'Erro ao interpretar a competência.'}, status=400)

        os_queryset = OrdemDeServico.objects.filter(
            forma_pagamento='faturar',
            cliente__tipo='lojista',
            data__date__gte=data_inicio.date(),
            data__date__lte=data_fim.date()
        )
        print(f'OSs encontradas: {os_queryset.count()}')
        
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
                    data_vencimento=data_fim
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
