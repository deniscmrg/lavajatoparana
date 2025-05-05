from django.core.management.base import BaseCommand
from django.utils.dateparse import parse_date
from datetime import datetime, timedelta
from core.models import OrdemDeServico, Fatura, FaturaOrdemServico, Cliente
from django.db import transaction
import calendar


class Command(BaseCommand):
    help = 'Gera faturas por competência para clientes lojistas'

    def add_arguments(self, parser):
        parser.add_argument('competencia', type=str, help='Competência no formato MMAAAA (ex: 052025)')
        parser.add_argument('--cliente_id', type=int, help='ID do cliente específico (opcional)')

    def handle(self, *args, **kwargs):
        competencia = kwargs['competencia']
        cliente_id = kwargs.get('cliente_id')

        mes = int(competencia[:2])
        ano = int(competencia[2:])
        data_inicio = datetime(ano, mes, 1)
        ultimo_dia = calendar.monthrange(ano, mes)[1]
        data_fim = datetime(ano, mes, ultimo_dia)

        os_queryset = OrdemDeServico.objects.filter(
            status='faturar',
            cliente__tipo='lojista',
            data__date__gte=data_inicio.date(),
            data__date__lte=data_fim.date()
        )

        if cliente_id:
            os_queryset = os_queryset.filter(cliente__id=cliente_id)

        clientes = os_queryset.values_list('cliente', flat=True).distinct()

        for cid in clientes:
            with transaction.atomic():
                cliente = Cliente.objects.get(id=cid)
                os_cliente = os_queryset.filter(cliente=cliente)

                fatura = Fatura.objects.create(
                    cliente=cliente,
                    data_vencimento=data_fim  # ou + X dias, se quiser dar prazo
                )

                for os in os_cliente:
                    FaturaOrdemServico.objects.create(
                        fatura=fatura,
                        ordem_servico=os
                    )

                self.stdout.write(self.style.SUCCESS(
                    f'Fatura criada para {cliente.nome} com {os_cliente.count()} OS.'
                ))
