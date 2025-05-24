from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClienteViewSet,
    VeiculoViewSet,
    ServicoViewSet,
    OrdemDeServicoViewSet,
    ServicoOrdemServicoViewSet,
    FaturaViewSet,
    LancamentoCaixaViewSet,
    ServicosPorOrdemAPIView,
    PerfilUsuarioView,
    exportar_fatura_pdf
)

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet)
router.register(r'veiculos', VeiculoViewSet)
router.register(r'servicos', ServicoViewSet)
router.register(r'ordens-servico', OrdemDeServicoViewSet)
router.register(r'servicos-ordem', ServicoOrdemServicoViewSet)
router.register(r'faturas', FaturaViewSet)
router.register(r'caixa', LancamentoCaixaViewSet, basename='caixa')

faturas_gerar = FaturaViewSet.as_view({'post': 'gerar_faturas'})

urlpatterns = [
    path('', include(router.urls)),
    path('servicos-da-os/<int:ordem_id>/', ServicosPorOrdemAPIView.as_view()),
    path('faturas/gerar-teste/', faturas_gerar),# ← rota adicional manual
    path('faturas/<int:pk>/exportar/', exportar_fatura_pdf, name='exportar_fatura_pdf'),
    path('perfil/', PerfilUsuarioView.as_view(), name='perfil-usuario'),
]