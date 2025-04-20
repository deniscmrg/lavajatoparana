from django.db import models
from django.contrib.auth.models import User

class Cliente(models.Model):
    nome = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    celular = models.CharField(max_length=20)
    tipo = models.CharField(max_length=50)

    def __str__(self):
        return self.nome


class Veiculo(models.Model):
    placa = models.CharField(max_length=10, primary_key=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    marca = models.CharField(max_length=50)
    modelo = models.CharField(max_length=50)
    cor = models.CharField(max_length=30)

    def __str__(self):
        return self.placa


class Servico(models.Model):
    STATUS_CHOICES = [
        ('ativo', 'Ativo'),
        ('inativo', 'Inativo'),
    ]

    descricao = models.CharField(max_length=100)
    valor_unitario = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ativo')

    def __str__(self):
        return self.descricao


# class OrdemDeServico(models.Model):
#     STATUS_CHOICES = [
#         ('aberta', 'Aberta'),
#         ('finalizada', 'Finalizada'),
#         ('cancelada', 'Cancelada'),
#     ]

#     cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
#     data = models.DateTimeField(auto_now_add=True)
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='aberta')
#     operador = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
#     forma_pagamento = models.CharField(max_length=50)
#     veiculo = models.ForeignKey(Veiculo, on_delete=models.CASCADE)

#     def __str__(self):
#         return f'OS {self.id} - {self.cliente.nome}'

from django.db import models
from django.contrib.auth.models import User
from .models import Cliente, Veiculo  # ajuste o import conforme a estrutura do seu projeto

class OrdemDeServico(models.Model):
    STATUS_CHOICES = [
        ('aberta', 'Aberta'),
        ('finalizada', 'Finalizada'),
        ('cancelada', 'Cancelada'),
    ]

    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    data = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='aberta')
    operador = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    forma_pagamento = models.CharField(max_length=50)
    veiculo = models.ForeignKey(Veiculo, on_delete=models.CASCADE)
    data_fechamento = models.DateTimeField(null=True, blank=True)  # <-- CAMPO NOVO

    def __str__(self):
        return f'OS {self.id} - {self.cliente.nome}'


class ServicoOrdemServico(models.Model):
    servico = models.ForeignKey(Servico, on_delete=models.CASCADE)
    ordem_servico = models.ForeignKey(OrdemDeServico, on_delete=models.CASCADE)
    quantidade = models.IntegerField()
    valor = models.DecimalField(max_digits=8, decimal_places=2)


class Fatura(models.Model):
    ordem_servico = models.ForeignKey(OrdemDeServico, on_delete=models.CASCADE)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    data_vencimento = models.DateField()
    competencia = models.CharField(max_length=7)  # ex: "03/2025"

    def __str__(self):
        return f'Fatura OS {self.ordem_servico.id}'


class Caixa(models.Model):
    TIPO_CHOICES = [
        ('entrada', 'Entrada'),
        ('saida', 'Saída'),
    ]

    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    descricao = models.CharField(max_length=100)
    valor = models.DecimalField(max_digits=8, decimal_places=2)
    fatura = models.ForeignKey(Fatura, on_delete=models.SET_NULL, null=True, blank=True)
    ordem_servico = models.ForeignKey(OrdemDeServico, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f'{self.tipo.upper()} - R$ {self.valor}'


class LancamentoCaixa(models.Model):
    TIPO_CHOICES = (
        ('entrada', 'Entrada'),
        ('saida', 'Saída'),
    )

    origem = models.CharField(max_length=100)
    descricao = models.TextField(blank=True, null=True)
    categoria = models.CharField(max_length=100)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data = models.DateField()

    def __str__(self):
        return f"{self.origem} - {self.valor} ({self.tipo})"