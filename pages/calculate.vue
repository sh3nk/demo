<template>
  <div class="calculate">
    <custom-card
      title="Scarcity calculator"
      subtitle="Select parameters to project future scarcity"
    >
      <b-row>
        <b-col sm="6" md="3">
          <span>Token cost</span>
          <b-form-input v-model="tokenCost.value" type="number" disabled />
        </b-col>

        <b-col sm="6" md="3">
          <span>Anchor cost</span>
          <b-form-input v-model="anchorCost.value" type="number" />
        </b-col>

        <b-col sm="6" md="3">
          <span>Customer acq rate</span>
          <b-form-input v-model="customerAcquisitionRate.value" type="number" />
        </b-col>

        <b-col sm="6" md="3">
          <span>Anchor rate</span>
          <b-form-input v-model="anchorRate.value" type="number" />
        </b-col>

        <b-col sm="6" md="3">
          <span>Burn interest</span>
          <b-form-input v-model="burnInterest.value" type="number" step="0.01" />
        </b-col>
      </b-row>

      <b-row>
        <b-col>
          <apexchart
            type="area"
            :height="areaOptions.chart.height || 600"
            :options="areaOptions"
            :series="splits"
          />

          <apexchart
            type="line"
            :height="lineOptions.chart.height || 200"
            :options="lineOptions"
            :series="[lineSeries]"
          />
        </b-col>
      </b-row>
    </custom-card>
  </div>
</template>
  
<script lang="ts">
import Vue from 'vue';
import moment from 'moment';

import CustomCard from '~/components/structure/CustomCard.vue';

export default Vue.extend({
  components: {
    CustomCard
  },

  data() {
    return {
      areaOptions,
      lineOptions,
      lineSeries: [] as any,

      tokenPool: 150 * (10**6),

      rates: {
        locked: 0.5,
        burned: 0.25, // burned in transaction
        circulation: 0.25 // back to circulation
      },

      tokenCost: {
        value: 0.1,
        range: [0.1, 0.1]
      },

      anchorCost: {
        value: 20,
        range: [20, 30]
      },

      customerAcquisitionRate: {
        // Average customer acquisition per month
        value: 10,
        range: [1, 20]
      },

      anchorRate: {
        // Average anchors per customer per month
        value: 60,
        range: [30, 720]
      },

      burnInterest: {
        // Burn interest rate
        value: 1.10,
        range: [1.01, 1.50]
      }
    };
  },

  computed: {
    splits(): {name: string, data: {x: number, y: string}[]}[] {
      let date = moment.utc('2022-01-01');
      const dateTo = moment.utc('2024-12-31');

      let ts = date.valueOf();
      let cost = this.tokenCost.value;

      const categories = {
        locked: {
          name: 'Locked',
          data: [{
            x: ts,
            y: '0'
          }] as {x: number, y: string}[]
        },
        burned: {
          name: 'Burned',
          type: 'area',
          data: [{
            x: ts,
            y: '0'
          }] as {x: number, y: string}[]
        },
        circulation: {
          name: 'In circulation',
          type: 'area',
          data: [{
            x: ts,
            y: this.tokenPool.toFixed(2)
          }] as {x: number, y: string}[]
        },
      };

      this.lineSeries = {
        name: 'Token cost',
        data: [{
          x: ts,
          y: cost.toFixed(2)
        }] as {x: number, y: string}[]
      };

      let customers = 0;
      let costPerMonthInTokens = 0;
      let tokensLocked = 0;
      let tokensBurned = 0;
      let tokensCirculation = this.tokenPool;

      while (date.isBefore(dateTo)) {
        date.add(1, 'month');
        ts = date.valueOf();

        const burnedPercentage = Math.floor((this.tokenPool - tokensCirculation) / (this.tokenPool * 0.01));
        cost = this.tokenCost.value * Math.pow(this.burnInterest.value, burnedPercentage);

        customers += this.customerAcquisitionRate.value * 1; // vue computed quirk
        costPerMonthInTokens = (customers
          * this.anchorRate.value
          * this.anchorCost.value
        ) / cost;

        tokensLocked += Math.round(costPerMonthInTokens * this.rates.locked);
        tokensBurned += Math.round(costPerMonthInTokens * this.rates.burned);
        tokensCirculation = this.tokenPool - tokensLocked - tokensBurned;

        categories.locked.data.push({
          x: ts,
          y: tokensLocked.toFixed(2)
        });

        categories.burned.data.push({
          x: ts,
          y: tokensBurned.toFixed(2)
        });

        categories.circulation.data.push({
          x: ts,
          y: tokensCirculation.toFixed(2)
        });

        this.lineSeries.data.push({
          x: ts,
          y: cost.toFixed(2)
        });
      }

      return Object.values(categories);
    }
  },
});

function formatGreaterUnits(val: number | string) {
  val = Number(val);
  if (val < 10000) {
    return val;
  }
  if (val < 1000000) {
    return (val/1000).toFixed(2) + 'K';
  }
  return (val/1000000).toFixed(2) + 'M';
}

const areaOptions = {
  chart: {
    id: 'chartArea',
    type: 'area',
    height: 600,
    stacked: true,
    toolbar: { show: false },
    zoom: { enabled: false }
  },
  colors: ['#4600BF', '#FF00D4', '#27D743'],
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth'
  },
  fill: {
    type: 'gradient',
    gradient: {
      opacityFrom: 0.6,
      opacityTo: 0.8
    }
  },
  legend: {
    position: 'top',
    horizontalAlign: 'left'
  },
  xaxis: {
    type: 'datetime'
  },
  yaxis: {
    labels: {
      formatter: (value: string) => formatGreaterUnits(value)
    }
  }
};

const lineOptions = {
  chart: {
    id: 'chartLine',
    type: 'line',
    height: 200,
    foreColor: '#4600BF',
    toolbar: { show: false },
    zoom: { enabled: false }
  },
  colors: ['#4600BF'],
  stroke: {
    width: 3,
    curve: 'smooth'
  },
  xaxis: {
    type: 'datetime'
  },
}
</script>
