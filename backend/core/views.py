from django.shortcuts import render
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from .models import Cliente, Veiculo, Servico, OrdemDeServico, ServicoOrdemServico, Fatura, Caixa, LancamentoCaixa
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


# class ClienteViewSet(viewsets.ModelViewSet):
#     queryset = Cliente.objects.all()
#     serializer_class = ClienteSerializer

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

class FaturaViewSet(viewsets.ModelViewSet):
    queryset = Fatura.objects.all()
    serializer_class = FaturaSerializer

class CaixaViewSet(viewsets.ModelViewSet):
    queryset = Caixa.objects.all()
    serializer_class = CaixaSerializer
    
class LancamentoCaixaViewSet(viewsets.ModelViewSet):
    queryset = LancamentoCaixa.objects.all().order_by('-data')
    serializer_class = LancamentoCaixaSerializer
