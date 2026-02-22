from django.urls import path

from .views import TicketClassifyView, TicketListCreateView, TicketPartialUpdateView, TicketStatsView

urlpatterns = [
    path('tickets/', TicketListCreateView.as_view(), name='ticket-list-create'),
    path('tickets/<int:ticket_id>/', TicketPartialUpdateView.as_view(), name='ticket-update'),
    path('tickets/stats/', TicketStatsView.as_view(), name='ticket-stats'),
    path('tickets/classify/', TicketClassifyView.as_view(), name='ticket-classify'),
]
