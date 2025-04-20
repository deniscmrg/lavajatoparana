from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClienteViewSet,
    VeiculoViewSet,
    ServicoViewSet,
    OrdemDeServicoViewSet,
    ServicoOrdemServicoViewSet,
    FaturaViewSet,
    LancamentoCaixaViewSet
)

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet)
router.register(r'veiculos', VeiculoViewSet)
router.register(r'servicos', ServicoViewSet)
router.register(r'ordens-servico', OrdemDeServicoViewSet)
router.register(r'servicos-ordem', ServicoOrdemServicoViewSet)
router.register(r'faturas', FaturaViewSet)
router.register(r'caixa', LancamentoCaixaViewSet, basename='caixa')

urlpatterns = [
    path('', include(router.urls)),
]