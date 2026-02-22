from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncDate
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .llm_service import TicketClassifier
from .models import Ticket
from .serializers import ClassifyRequestSerializer, TicketSerializer


class TicketListCreateView(APIView):
    def get(self, request):
        queryset = Ticket.objects.all().order_by('-created_at')

        category = request.query_params.get('category')
        priority = request.query_params.get('priority')
        ticket_status = request.query_params.get('status')
        search = request.query_params.get('search')

        if category:
            queryset = queryset.filter(category=category)
        if priority:
            queryset = queryset.filter(priority=priority)
        if ticket_status:
            queryset = queryset.filter(status=ticket_status)
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))

        serializer = TicketSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket = serializer.save()
        return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)


class TicketPartialUpdateView(APIView):
    def patch(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(pk=ticket_id)
        except Ticket.DoesNotExist:
            return Response({'detail': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = TicketSerializer(ticket, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class TicketStatsView(APIView):
    def get(self, request):
        totals = Ticket.objects.aggregate(
            total_tickets=Count('id'),
            open_tickets=Count('id', filter=Q(status=Ticket.STATUS_OPEN)),
        )

        daily_counts = (
            Ticket.objects.annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(count=Count('id'))
        )
        avg_tickets_per_day = daily_counts.aggregate(avg=Avg('count')).get('avg') or 0

        priority_rows = Ticket.objects.values('priority').annotate(count=Count('id'))
        category_rows = Ticket.objects.values('category').annotate(count=Count('id'))

        priority_breakdown = {choice[0]: 0 for choice in Ticket.PRIORITY_CHOICES}
        for row in priority_rows:
            priority_breakdown[row['priority']] = row['count']

        category_breakdown = {choice[0]: 0 for choice in Ticket.CATEGORY_CHOICES}
        for row in category_rows:
            category_breakdown[row['category']] = row['count']

        return Response(
            {
                'total_tickets': totals['total_tickets'],
                'open_tickets': totals['open_tickets'],
                'avg_tickets_per_day': round(float(avg_tickets_per_day), 2),
                'priority_breakdown': priority_breakdown,
                'category_breakdown': category_breakdown,
            }
        )


class TicketClassifyView(APIView):
    def post(self, request):
        serializer = ClassifyRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        classifier = TicketClassifier()
        result = classifier.classify(serializer.validated_data['description'])
        return Response(result)
