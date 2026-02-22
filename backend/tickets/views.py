from django.db.models import Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Ticket
from .serializers import TicketSerializer
from .llm_service import classify_ticket


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        queryset = Ticket.objects.all()

        category = self.request.query_params.get('category')
        priority = self.request.query_params.get('priority')
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if category:
            queryset = queryset.filter(category=category)
        if priority:
            queryset = queryset.filter(priority=priority)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        return queryset

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        total = Ticket.objects.count()

        status_counts = {s: 0 for s in ['open', 'in_progress', 'resolved', 'closed']}
        for row in Ticket.objects.values('status').annotate(count=Count('status')):
            status_counts[row['status']] = row['count']

        category_counts = {c: 0 for c in ['billing', 'technical', 'account', 'general']}
        for row in Ticket.objects.values('category').annotate(count=Count('category')):
            category_counts[row['category']] = row['count']

        priority_counts = {p: 0 for p in ['low', 'medium', 'high', 'critical']}
        for row in Ticket.objects.values('priority').annotate(count=Count('priority')):
            priority_counts[row['priority']] = row['count']

        return Response({
            'total_tickets': total,
            'by_status': status_counts,
            'by_category': category_counts,
            'by_priority': priority_counts,
        })

    @action(detail=False, methods=['post'], url_path='classify')
    def classify(self, request):
        title = request.data.get('title', '')
        description = request.data.get('description', '')

        if not title and not description:
            return Response(
                {'error': 'title or description is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = classify_ticket(title, description)
        return Response(result)
