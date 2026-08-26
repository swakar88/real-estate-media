from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0032_emaillog_add_body'),
    ]

    operations = [
        migrations.CreateModel(
            name='AddOn',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('price', models.DecimalField(decimal_places=2, max_digits=8)),
                ('description', models.TextField(blank=True)),
                ('turnaround', models.CharField(blank=True, help_text="e.g. '24 Hours'", max_length=50)),
                ('order', models.IntegerField(default=0, help_text='Display order')),
            ],
            options={
                'ordering': ['order'],
            },
        ),
        migrations.AddField(
            model_name='bookingrequest',
            name='selected_addons',
            field=models.ManyToManyField(blank=True, related_name='booking_requests', to='api.addon'),
        ),
        migrations.AddField(
            model_name='clientshoot',
            name='selected_addons',
            field=models.ManyToManyField(blank=True, related_name='client_shoots', to='api.addon'),
        ),
    ]
