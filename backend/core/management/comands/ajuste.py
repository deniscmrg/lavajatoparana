from django.core.management.base import BaseCommand
from core.models import OrdemDeServico
from django.utils.timezone import make_aware
from datetime import datetime
import pytz

class Command(BaseCommand):
    help = 'Corrige campos de data e data_fechamento das ordens de serviço para timezone-aware (America/Sao_Paulo)'

    def handle(self, *args, **kwargs):
        tz_sp = pytz.timezone('America/Sao_Paulo')
        corrigidas = 0
        total = 0

        self.stdout.write("▶ Iniciando ajuste de datas...\n")

        for os in OrdemDeServico.objects.all():
            total += 1

            if os.data:
                os.data = make_aware(os.data.replace(tzinfo=None), timezone=tz_sp)

            if os.data_fechamento:
                os.data_fechamento = make_aware(os.data_fechamento.replace(tzinfo=None), timezone=tz_sp)

            os.save(update_fields=['data', 'data_fechamento'])
            corrigidas += 1

        self.stdout.write(f"\n✅ Concluído: {corrigidas} ordens atualizadas de {total}.")
