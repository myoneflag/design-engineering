<script>
import Vue from 'vue';
import Component from 'vue-class-component';
import { Bar, mixins } from 'vue-chartjs';

@Component({
    extends: Bar,
    mixins: [mixins.reactiveProp],
    props: ["options"]
})
export default class BarChart extends Vue {
    chartOptions = {}

    mounted () {
        this.chartOptions = Object.assign({}, {
            responsive: true,
            maintainAspectRatio: false, 
        }, this.options);

        this.renderChart(this.chartData, this.chartOptions);
    }
}
</script>