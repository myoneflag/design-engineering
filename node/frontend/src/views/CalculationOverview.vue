<template>
    <div>
        <DrawingNavBar></DrawingNavBar>
        <b-container style="margin-top: 50px">
            <b-row>
                <b-col>
                    <h3>Calculation Methods and Details</h3>
                </b-col>
            </b-row>
            <b-row style="padding-top: 20px">
                <b-col cols="4">
                    <div style="position:relative; height: calc(125vh - 180px); overflow-y:auto; text-align: left">
                        <b-navbar v-b-scrollspy:scrollspy-nested class="flex-column">
                            <b-nav pills vertical>
                                <template v-for="section in content">
                                    <template v-if="typeof section.content === 'string'">
                                        <b-nav-item :href="'#' + section.id" style="font-weight: bold">{{
                                            section.title
                                        }}</b-nav-item>
                                    </template>
                                    <template v-else>
                                        <b-nav-item :href="'#' + section.id" style="font-weight: bold">{{
                                            section.title
                                        }}</b-nav-item>
                                        <b-nav pills vertical small>
                                            <b-nav-item
                                                class="ml-3 my-1"
                                                v-for="subsection in section.content"
                                                :href="'#' + subsection.id"
                                                >{{ subsection.title }}</b-nav-item
                                            >
                                        </b-nav>
                                    </template>
                                </template>
                            </b-nav>
                        </b-navbar>
                    </div>
                </b-col>
                <b-col cols="8">
                    <div
                        id="scrollspy-nested"
                        style="position:relative; height: calc(125vh - 180px); overflow-y:auto; text-align: left"
                    >
                        <template v-for="section in content">
                            <template v-if="typeof section.content === 'string'">
                                <h3 :id="section.id" style="margin-top: 50px">{{ section.title }}</h3>
                                <div v-html="section.content"></div>
                            </template>
                            <template v-else>
                                <h3 :id="section.id" style="margin-bottom: 25px; margin-top: 50px">
                                    {{ section.title }}
                                </h3>
                                <div v-for="subsection in section.content" :key="subsection.id">
                                    <h4 :id="subsection.id">{{ subsection.title }}</h4>
                                    <div v-html="subsection.content"></div>
                                </div>
                            </template>
                        </template>
                    </div>
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import DrawingNavBar from "../components/DrawingNavBar.vue";

@Component({
    components: { DrawingNavBar }
})
export default class ProjectSettings extends Vue {
    get content(): Section[] {
        return [
            {
                title: "Pipe Sizing",
                id: "pipe-sizing",
                content:
                    "<p>The pipes are sized based on the probable simultaneous demand (PSD). The PSD is based on the fixtures and continuous flows downstream of each section of pipe and is used to size each pipe within the velocity you specify. The PSD is calculated based on a formula or from a lookup table depending on which PSD method you choose. The software currently has a variety of choices from across the globe including, Europe, Australia and the USA.<p>" +
                    "The software allows any pipe sizes to be overridden should the user want to do so.<p>" +
                    "Once the flow rate is known, the smallest pipe size will be selected that has a velocity less than the set parameter."
            },

            {
                title: "PSD Method Notes",
                id: "psd-methods",
                content: [
                    {
                        title: "AS3500 Loading Units – Table 3.2.4 of AS3500.1:2018",
                        id: "as3500-loading-units",
                        content: "<p>Note this only works between 1-60 LU and anything above will be prohibited."
                    },
                    {
                        title: "Barrie’s Book Loading Units – Topic No. 4.2",
                        id: "barries-book-loading-units",
                        content: "<p>Note this only works between 1-60 LU and anything above will be prohibited."
                    },
                    {
                        title: "AS3500 Dwellings – Table 3.2.3 of AS3500.1:2018",
                        id: "as3500-dewllings",
                        content:
                            "<p>Note that fixtures in the dwelling will be sized based on the formula in AS3500.1:2018. Any pipes downstream of a dwelling will be sized based on the selected loading unit method."
                    },
                    {
                        title: "Barrie’s Book Dwellings – Topic No. 4.7",
                        id: "barries-book-dwellings",
                        content:
                            "<p>Note that fixtures downstream of dwellings will be sized based on Topic 4.2 of Barrie’s Book<p>" +
                            "Note that where there are jumps between loading units, the table has been extrapolated to provide a more accurate result.<p>" +
                            "Note that where there is a minimum and maximum flow rate for the amount of dwellings, a number that is approximately between the two has been selected."
                    },
                    {
                        title: "DIN1998-300 2012",
                        id: "din1998-300",
                        content:
                            "Note this only works between 0.2-500 l/sec full flow, anything below will use full flow and anything above will be prohibited."
                    }
                ]
            },

            {
                title: "Velocity",
                id: "velocity",
                content:
                    "<p>Once the PSD is determined, the pipe size is selected based on the below formula which determines the velocity at the pipe size. One of the ways the software will size pipes is by finding the smallest pipe size at the maximum selected velocity.<p>" +
                    "Velocity (m/s) = (Flow Rate (L/s) / 1000)/((PI*Radius of internal diameter (mm)^2)/1000000)"
            },

            {
                title: "Pressure Loss",
                id: "pressure-loss",
                content: [
                    {
                        title: "Pipe Pressure Loss",
                        id: "pipe-pressure-loss",
                        content:
                            "<p>The Darcy Weisbach formula is used to determine friction loss in the pipe. This is preferred to Hazen Williams due to it not being as accurate; for example, Hazen Williams does not consider viscosity (temperature of water).<p>" +
                            "Darcy Weisbach (mH) = Friction Factor * (pipe length (m) / pipe diameter (mm)) * (velocity^2/19.62)<p>" +
                            "Friction Factor = {f = [1.14 + 2 log10(D/e)]-2} and then iteratively f = {-2*log10[((e/D)/3.7)+(2.51/(Re*(f1/2))]}-2 until the first several decimal places are the same."
                    },

                    {
                        title: "Pipe Vertical Pressure Loss",
                        id: "pipe-vertical-pressure-loss",
                        content:
                            "<p>In addition to any pressure loss in pipes due to friction loss from the flow rate and through the fittings, there are additional losses when the pipe changes level. For example, if the flow is going down a riser, it gains 9.81kPa/metre; if the flow is going up a riser, it loses 9.81kPa/metre. However we don't take into account changes to atmospheric pressure, or minute difference in gravitational acceleration."
                    },

                    {
                        title: "Fitting Pressure Loss",
                        id: "fitting-pressure-loss",
                        content:
                            "<p>The pressure loss through a fitting is determined based on the k value of the fitting and at what velocity the water passes through the fitting.<p>" +
                            "Fitting friction loss (mH) = k * (velocity^2)/(9.81*2)<p>" +
                            "When a bend is drawn that is <45 or between 45 + 90, the greater size bend will be used for the pressure loss calculation."
                    },

                    {
                        title: "Pressure Loss Through TMV",
                        id: "pressure-loss-through-tmv",
                        content:
                            "The pressure loss through the TMV is determined based on a graph - the higher the flow rate, the higher the friction loss."
                    },

                    {
                        title: "Pressure Loss Through RPZD",
                        id: "pressure-loss-through-rpzd",
                        content:
                            "<p>The pressure loss through the RPZD is determined based on the size of the RPZD and the associated graph - the higher the flow rate, the higher the friction loss. <p>" +
                            "You are able to select dual RPZDs in parallel. If you select RPZDs to be each size to 50% of the peak flow rate, the pressure loss will be calculated based on 50% of the peak flow through each RPZD. If you select RPZDs to be each size to 100% of the peak flow rate, the pressure loss will be calculated based on 100% of the peak flow through one RPZD as it is assumed that the design is to allow for one of the RPZDs to be isolated."
                    }
                ]
            },

            {
                title: "Mixing Temperatures",
                id: "mixing-temperatures",
                content:
                    "<p>To get tempered water at an outlet, it usually requires a mixture of hot and cold water. To determine the PSD in the hot water system which uses flow rates to determine the PSD, we need to know what % of the tap flow rates comes from the hot water otherwise we would be oversizing.<p>" +
                    "Temperature = (Mass 1 * Temp 1) + (Mass 2 * Temp 2) / Mass1 + Mass 2"
            },

            {
                title: "Fine Print",
                id: "fine-print",
                content: [
                    {
                        title: "Disclaimer",
                        id: "disclaimer",
                        content:
                            "<p>The information that contributes to the sizing and selecting of all components in the system can be found in the catalog. It is imperative that the catalog is reviewed and only used if the user agrees with the information.<p>" +
                            "This software is providing a service and does not provide design certification. You are able to draw a functioning system at ease. You are also able to draw a dysfunctional system for experimentation, so take care."
                    },

                    {
                        title: "Design Certifications",
                        id: "design-certifications",
                        content:
                            "<p>You must provide your own design certification in addition to using the software. Our software is designed to be versatile and flexible, and so is unable to provide design certification. Some examples why:" +
                            "<ul>" +
                            "<li>We permit and provide calculations for incomplete / experimental drawings, designs and fixture configurations.</li>" +
                            "<li>We offer pipe sizing standards other than the Australian Standards</li></li>" +
                            "<li>We allow entry of any pressure setting to the flow sources, which don't have to be realistic or correct.</li>" +
                            "</ul>"
                    },

                    {
                        title: "Common traps",
                        id: "common-traps",
                        content:
                            "<p>We allow drawing systems freely, but as a result, there are times where you should be more aware:" +
                            "<ul>" +
                            "<li>Drawing pipes in exactly the same location as pipes that already exist. They look the same in 2D.</li>" +
                            "<li>We allow drawing things that can not physically be built.</li>" +
                            "<li>Cross connections of hot and cold water pipework.</li>" +
                            "<li>Pipe clashes in 3D as these are not prompted by the software.</li>" +
                            "<li>Changing the scale of the drawing after pipework has been drawn. You need to check if everything re-scaled properly</li>" +
                            "</ul>"
                    }
                ]
            }
        ];
    }
}

interface Section {
    title: string;
    id: string;
    content:
        | Array<{
              title: string;
              id: string;
              content: string;
          }>
        | string;
}
</script>
