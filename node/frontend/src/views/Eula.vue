<template>
    <div>
        <MainNavBar></MainNavBar>
        <div style="">
            <b-container>
                <b-row>
                    <b-col>
                        <h1 class="title">
                            End User License Agreement
                        </h1>
                    </b-col>
                </b-row>
                <b-row>
                    <b-col cols="2"></b-col>
                    <b-col
                        style="margin-bottom: 30px;
                            overflow-y: auto;
                            overflow-x: hidden;
                            height: calc(125vh- 300px)"
                    >
                        <p>
                            This agreement is between
                            <b>
                                {{
                                    profile
                                        ? profile.name +
                                          (profile.organization ? " of " + this.profile.organization.name : "")
                                        : "[Logged Out]"
                                }}</b
                            >
                            and <b>H2X Pty Ltd (ACN 636 693 288)</b>, a registered company under the Corporations Law of
                            Australia. The agreement is held under Australian law. By clicking "I Accept", you
                            understand and agree to the following terms and conditions.
                        </p>

                        <h2>Account Terms and Conditions</h2>
                        <ol>
                            <li>
                                H2X accounts are not to be shared without our consent, any violations of this will be an
                                infringement of Copyright laws. This is because the software is the intellectual
                                property of H2X Pty Ltd.
                            </li>
                            <li>
                                H2X accounts are designed for a single user only, you will experience lockouts or
                                suspensions if the account is used simultaneously in two or more locations. This is to
                                protect unlawful use of H2X software.
                            </li>
                            <li>
                                You may not rent, lease, sub-license, lend or transfer the product to another person or
                                legal entity without the prior written consent of H2X. This is to ensure H2X controls
                                the use of their product.
                            </li>
                        </ol>
                        <h2>Software & Usage Terms & Conditions</h2>
                        <ol>
                            <li>
                                Results from any engineering software should always be double-checked when applied in
                                real-life applications. As a H2X user it is your responsibility to verify and validate
                                the output of the software with some other independent means. This is because the
                                results are all based on theoretical input and solutions. With any design, a wide
                                variety of other factors can directly impact the actual results and behaviour of real
                                life outcomes. Some examples include internal diameter of fittings, pressure loss
                                through tapware, material properties, construction inaccuracies etc. As a user you
                                understand that such variables can alter the results of H2X outcomes, and this should be
                                considered in your design and calculations.
                            </li>
                            <li>
                                The user is to review the calculations described within the software and must not use
                                the software if they disagree with any of the calculation methods used. The user must
                                not use the software if they are unclear about how any of the calculations are
                                undertaken and must contact H2X to resolve any queries.
                            </li>
                            <li>
                                As a user of H2X software, you agree to use sufficient duty of care when using H2X
                                products. This includes not designing or constructing anything outside of your abilities
                                and knowledge as an engineer. As with all engineering software, one should always
                                question the results and perform sufficient checks that the results are logical and
                                correct. H2X Pty Ltd take no responsibility for any damages, liabilities or consequences
                                resulting from any use of our software.
                            </li>
                            <li>
                                There are literally millions of design scenarios. This makes it impossible to test and
                                ensure accuracy in every single possible scenario. As with any software, there may be
                                bugs or errors that cause it to function incorrectly. As a user you understand that
                                although all H2X software goes through extensive testing, the risk of deviated results
                                due to software failure is still possible.
                            </li>
                            <li>
                                H2X results are not to be used for design purposes unless signed off by a professional
                                and competent hydraulic engineer. The user understands that the software does not
                                provide certification as it is only offering a service for calculations and does not
                                claim to provide compliant results in relation to relevant standards. For example, the
                                software will calculate the pressure at the fixture, but the user needs to ensure that
                                that pressure is sufficient.
                            </li>
                            <li>
                                You, at your sole expense, will defend, indemnify and hold H2X harmless from and with
                                respect to any loss or damage (including attorneys’ fees and costs) incurred in
                                connection with, any suit or proceeding brought by a third party against H2X.
                            </li>
                            <li>
                                H2X reserves the right to use your files as marketing material in the form of
                                screenshots and visual mediums only. To opt out of this, please contact us. H2X will
                                never release your designs or files to a third party or any other subscriber without
                                your permission.
                            </li>
                            <li>You agree to accept communication in the form of emails.</li>
                        </ol>
                        <h2>Privacy Policy</h2>
                        The following privacy policy applies to our website, service and applications:
                        <ol>
                            <li>
                                As a registered user, you agree to have your information collected in accordance to the
                                Australian Privacy Act 1988. This information can be used or distributed by H2X as long
                                as it is within the legal bounds of the Australian Privacy Act of 1988.
                            </li>
                            <li>
                                As a registered user, users agree to allowing H2X to use company name and logo with
                                comments ('used by') for marketing purposes for a period of 18 months from registration
                                or the last date of subscription payment. Users can opt out of this at any time by
                                sending us an email.
                            </li>
                        </ol>
                    </b-col>
                    <b-col cols="2"></b-col>
                </b-row>
                <b-row>
                    <b-col id="acceptDeclineBtn">
                        <b-button variant="secondary" style="margin-right: 20px" @click="decline">
                            I Decline
                        </b-button>
                        <b-button
                            id="acceptBtn"
                            variant="success"
                            @click="accept"
                            :disabled="profile && profile.eulaAccepted"
                        >
                            I Accept
                            <b-tooltip target="acceptDeclineBtn" v-if="profile && profile.eulaAccepted">
                                You have already accepted the EULA
                            </b-tooltip>
                            <b-tooltip target="acceptDeclineBtn">
                                Please read the agreement before accepting
                            </b-tooltip>                            
                        </b-button>
                    </b-col>
                </b-row>
            </b-container>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import MainNavBar from "../../src/components/MainNavBar.vue";
import { Document } from "../../../common/src/models/Document";
import { User } from "../../../common/src/models/User";
import { acceptEula, declineEula, logout } from "../api/logins";
import { createDocument, EXAMPLE_DOCUMENT_ID } from "../api/document";
import { SupportedLocales } from "../../../common/src/api/locale";

@Component({
    components: {
        MainNavBar
    }
})
export default class Home extends Vue {
    documents: Document[] = [];
    loaded: boolean = false;

    get profile(): User {
        return this.$store.getters["profile/profile"];
    }

    async decline() {
        const res = await declineEula();
        if (res.success) {
            (this as any).$cookies.remove("session-id");
            await logout();
            await this.$store.dispatch("profile/setProfile", null);
            await this.$router.push("/login");
        } else {
            this.$bvToast.toast(res.message, {
                variant: "danger",
                title: "Error Connecting to Server"
            });
        }
    }

    async accept() {
        const res = await acceptEula();
        if (res.success) {
            await this.$store.dispatch("profile/setProfile", null);
            await createDocument(this.locale, EXAMPLE_DOCUMENT_ID);
            window.location.replace("/");
        } else {
            this.$bvToast.toast(res.message, {
                variant: "danger",
                title: "Error Connecting to Server"
            });
        }
    }

    get locale(): SupportedLocales {
        return this.$store.getters['profile/locale'];
    }
}
</script>

<style lang="less">
h1 {
    padding-top: 50px;
}
</style>
