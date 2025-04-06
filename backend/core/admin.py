from django.contrib import admin
from .models import Cliente, Veiculo, Servico, OrdemDeServico, ServicoOrdemServico, Fatura, Caixa

admin.site.register(Cliente)
admin.site.register(Veiculo)
admin.site.register(Servico)
admin.site.register(OrdemDeServico)
admin.site.register(ServicoOrdemServico)
admin.site.register(Fatura)
admin.site.register(Caixa)
