from rest_framework import serializers

from .models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ['id', 'title', 'description', 'category', 'priority', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Title is required.')
        if len(value) > 200:
            raise serializers.ValidationError('Title cannot exceed 200 characters.')
        return value

    def validate_description(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Description is required.')
        return value


class ClassifyRequestSerializer(serializers.Serializer):
    description = serializers.CharField(required=True, allow_blank=False)


class ClassifyResponseSerializer(serializers.Serializer):
    suggested_category = serializers.ChoiceField(choices=[choice[0] for choice in Ticket.CATEGORY_CHOICES])
    suggested_priority = serializers.ChoiceField(choices=[choice[0] for choice in Ticket.PRIORITY_CHOICES])
