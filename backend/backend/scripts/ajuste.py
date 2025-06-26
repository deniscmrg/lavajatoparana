from core.models import OrdemDeServico
from django.utils.timezone import make_aware
from datetime import datetime
import pytz

tz_sp = pytz.timezone('America/Sao_Paulo')

corrigidas = 0
total = 0

print("Regravando todos os campos de data com timezone...\n")

for os in OrdemDeServico.objects.all():
    total += 1

    # Corrigir data de criação (data)
    if os.data:
        naive_data = os.data.replace(tzinfo=None)
        os.data = make_aware(naive_data, timezone=tz_sp)

    # Corrigir data de fechamento (data_fechamento)
    if os.data_fechamento:
        naive_fechamento = os.data_fechamento.replace(tzinfo=None)
        os.data_fechamento = make_aware(naive_fechamento, timezone=tz_sp)

    os.save(update_fields=['data', 'data_fechamento'])  # força gravação
    corrigidas += 1

print(f"\nConcluído: {corrigidas} ordens atualizadas de {total}.")
