from django.shortcuts import render
from rest_framework import viewsets
from .models import Cliente, Veiculo, Servico, OrdemDeServico, ServicoOrdemServico, Fatura, Caixa
from .serializers import (
    ClienteSerializer,
    VeiculoSerializer,
    ServicoSerializer,
    OrdemDeServicoSerializer,
    ServicoOrdemServicoSerializer,
    FaturaSerializer,
    CaixaSerializer
)

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer

class VeiculoViewSet(viewsets.ModelViewSet):
    queryset = Veiculo.objects.all()
    serializer_class = VeiculoSerializer

class ServicoViewSet(viewsets.ModelViewSet):
    queryset = Servico.objects.all()
    serializer_class = ServicoSerializer

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
