from rest_framework import serializers
from .models import Cliente, Veiculo, Servico, OrdemDeServico, ServicoOrdemServico, Fatura, Caixa, LancamentoCaixa

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


class ServicoOrdemServicoSerializer(serializers.ModelSerializer):
    descricao = serializers.CharField(source='servico.descricao', read_only=True)

    class Meta:
        model = ServicoOrdemServico
        fields = ['id', 'ordem_servico', 'servico', 'descricao', 'quantidade', 'valor']


class OrdemDeServicoSerializer(serializers.ModelSerializer):
    cliente_id = serializers.PrimaryKeyRelatedField(
        queryset=Cliente.objects.all(), source='cliente', write_only=True, required=False  # ← adicionado required=False
    )
    veiculo_id = serializers.PrimaryKeyRelatedField(
        queryset=Veiculo.objects.all(), source='veiculo', write_only=True, required=False  # ← adicionado required=False
    )

    cliente = ClienteSerializer(read_only=True)
    veiculo = VeiculoSerializer(read_only=True)
    servicos_ordem = serializers.SerializerMethodField()

    class Meta:
        model = OrdemDeServico
        fields = [
            'id', 'data', 'status', 'operador', 'forma_pagamento',
            'cliente', 'cliente_id', 'veiculo', 'veiculo_id',
            'data_fechamento',  # ← opcional: já que você está mostrando no frontend
            'servicos_ordem',
        ]
        extra_kwargs = {
            'status': {'required': False},
            'forma_pagamento': {'required': False},
        }

    def get_servicos_ordem(self, obj):
        servicos = ServicoOrdemServico.objects.filter(ordem_servico=obj)
        return ServicoOrdemServicoSerializer(servicos, many=True).data


class FaturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fatura
        fields = '__all__'


class CaixaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caixa
        fields = '__all__'
        
class LancamentoCaixaSerializer(serializers.ModelSerializer):
    class Meta:
        model = LancamentoCaixa
        fields = '__all__'