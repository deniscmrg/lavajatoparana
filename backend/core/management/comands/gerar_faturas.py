from django.core.management.base import BaseCommand
from django.utils.timezone import make_aware
from datetime import datetime
from core.models import OrdemDeServico, Fatura, FaturaOrdemServico, Cliente
from django.db import transaction
import calendar
import pytz

class Command(BaseCommand):
    help = 'Gera faturas por competência para clientes lojistas'

    def add_arguments(self, parser):
        parser.add_argument('competencia', type=str, help='Competência no formato MMAAAA (ex: 062025)')
        parser.add_argument('--cliente_id', type=int, help='ID do cliente específico (opcional)')

    def handle(self, *args, **kwargs):
        competencia = kwargs['competencia']
        cliente_id = kwargs.get('cliente_id')

        if not competencia or len(competencia) != 6:
            self.stderr.write("Competência inválida. Use o formato MMAAAA.")
            return

        mes = int(competencia[:2])
        ano = int(competencia[2:])
        ultimo_dia = calendar.monthrange(ano, mes)[1]

        tz_sp = pytz.timezone('America/Sao_Paulo')
        data_inicio = make_aware(datetime(ano, mes, 1, 0, 0, 0), timezone=tz_sp)
        data_fim = make_aware(datetime(ano, mes, ultimo_dia, 23, 59, 59), timezone=tz_sp)

        self.stdout.write(f"⏳ Gerando faturas de {competencia} para OS entre {data_inicio} e {data_fim}...\n")

        os_queryset = OrdemDeServico.objects.filter(
            forma_pagamento='faturar',
            cliente__tipo='lojista',
            data__range=(data_inicio, data_fim)
        )

        if cliente_id:
            os_queryset = os_queryset.filter(cliente__id=cliente_id)

        clientes_ids = os_queryset.values_list('cliente', flat=True).distinct()

        if not clientes_ids:
            self.stdout.write("⚠️ Nenhuma ordem de serviço encontrada para a competência.")
            return

        for cid in clientes_ids:
            with transaction.atomic():
                cliente = Cliente.objects.get(id=cid)
                os_cliente = os_queryset.filter(cliente=cliente)

                fatura = Fatura.objects.create(
                    cliente=cliente,
                    data_vencimento=data_fim.date(),  # ou acrescente dias se quiser
                    competencia=competencia
                )

                for os in os_cliente:
                    FaturaOrdemServico.objects.create(
                        fatura=fatura,
                        ordem_servico=os
                    )

                self.stdout.write(
                    self.style.SUCCESS(f"✅ Fatura criada para {cliente.nome} com {os_cliente.count()} OS.")
                )
