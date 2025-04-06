from rest_framework import serializers
from .models import Cliente, Veiculo, Servico, OrdemDeServico, ServicoOrdemServico, Fatura, Caixa

# serializers.py
from rest_framework import serializers
from .models import Veiculo

class VeiculoSerializer(serializers.ModelSerializer):
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True)

    class Meta:
        model = Veiculo
        fields = ['placa', 'cliente', 'cliente_nome', 'marca', 'modelo', 'cor']


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'


class ServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servico
        fields = '__all__'


class OrdemDeServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrdemDeServico
        fields = '__all__'


class ServicoOrdemServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServicoOrdemServico
        fields = '__all__'


class FaturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fatura
        fields = '__all__'


class CaixaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caixa
        fields = '__all__'