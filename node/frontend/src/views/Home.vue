l<template>
  <div>
    <MainNavBar :profile="profile"></MainNavBar>
    <div
      style="overflow-y: auto; overflow-x: hidden; height: calc(100vh - 70px)"
      :class="[profile && !profile.email_verified_at && 'isEmailVerification']"
    >
      <LocaleSelector />
      <b-container class="home">
        <b-row>
          <b-col class="text-left">
            <h1 class="title text-primary">
              Projects
            </h1>
            <context-menu id="context-menu" ref="ctxMenu">
              <li @click="openOnNewTab(`document/${contextId}/1`)" class="context-link">Open in new tab</li>
            </context-menu>
          </b-col>
          <b-col class="text-right">
            <h1>
              <b-button size="lg" class=" btn mt-3 btn-success" @click="handleCreateDocument"
                ><v-icon name="plus"></v-icon> New project</b-button
              >
            </h1>
          </b-col>
        </b-row>

        <b-row>
          <b-col>
            <b-alert variant="success" v-if="allDocuments.length === 0 && loaded" show
              >You don't have any documents right now.</b-alert
            >
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-modal
              id="modal-1"
              scrollable
              title="What's New"
              v-if="compiledChangeLogs.length >= 0"
              size="lg"
              @hidden="changeLogModalHidden"
            >
              <b-card v-for="log in compiledChangeLogs" :key="log.id">
                <b-card-text style="text-align: left;">
                  <b>Version:</b> {{ log.version }}<br />
                  <span style="white-space: pre-wrap">{{ log.message }}</span> <br /><br />
                  {{ new Date(log.createdOn).toLocaleString() }}<br />
                  <b>Submitted by:</b> {{ log.submittedBy.username }}<br />
                  <b-badge pill variant="primary" v-for="badge in log.tags.split(',')" :key="badge">{{
                    badge
                  }}</b-badge>
                </b-card-text>
              </b-card>
            </b-modal>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="6">
            <div class="text-left  mt-4">
              <b-button
                class=" btn border "
                :class="{
                  'btn-success border-success': projectFilter === ProjectTabFilters.MY_PROJECTS,
                  'btn-light border-secondary': projectFilter != ProjectTabFilters.MY_PROJECTS
                }"
                @click="changeTab(ProjectTabFilters.MY_PROJECTS)"
              >
                My projects
              </b-button>
              <b-button
                class=" btn border  ml-2"
                :class="{
                  'btn-success border-success': projectFilter === ProjectTabFilters.ORGANIZATION_PROJECTS,
                  'btn-light  border-secondary': projectFilter != ProjectTabFilters.ORGANIZATION_PROJECTS
                }"
                @click="changeTab(ProjectTabFilters.ORGANIZATION_PROJECTS)"
              >
                Organization projects
              </b-button>
              <b-button
                v-if="profile && profile.accessLevel == 0"
                class=" btn border ml-2"
                :class="{
                  'btn-success border-success': projectFilter === ProjectTabFilters.ALL_PROJECTS,
                  'btn-light  border-secondary': projectFilter != ProjectTabFilters.ALL_PROJECTS
                }"
                @click="changeTab(ProjectTabFilters.ALL_PROJECTS)"
              >
                  Search All Projects
                <b-badge>
                  H2X
                </b-badge>
              </b-button>
            </div>
          </b-col>
          <b-col cols="4">
            <div class="text-right  mt-4">
              <div class="form-outline">
                <input
                  type="search"
                  id="searchbox"
                  v-model="searchCondition"
                  v-debounce:500ms="filterDocuments"
                  class="form-control d-flex-inline"
                  placeholder="Search project name..."
                  aria-label="Search"
                />
              </div>
            </div>
          </b-col>
          <b-col cols="2" class="p-1">
            <b-checkbox
              class="mt-4"
              v-if="profile ? profile.accessLevel <= AccessLevel.MANAGER : false"
              @change="toggleShowDeleted"
            >
              Show deleted
            </b-checkbox>
          </b-col>
        </b-row>
        <b-row v-if="projectFilter !== ProjectTabFilters.ALL_PROJECTS">
          <b-col class="text-left mt-2">
            <button-tag
              v-if="documentTags.length == 0"
              :classList="'pill border-secondary text-secondary border p-2 btn-sm text-sm btn-small mb-1 ml-1 px-2'"
              v-b-tooltip.hover="{
                title: 'Use tags to organize your projects'
              }"
              :item="'Tag'"
              :startWith="'#'"
            ></button-tag>
            <button-tag
              v-for="item in documentTags"
              @tag-clicked="tagClicked"
              :selectedTags="selectedTags"
              :key="item"
              :classList="'pill border-primary mt-1 text-primary border btn-sm p-2 mr-1'"
              :item="item"
              :startWith="'#'"
            ></button-tag>
          </b-col>
        </b-row>
        <b-row>
          <template v-for="doc in filteredDocuments">
            <b-col sm="6" md="4" lg="3" :class="'mt-4'" :key="doc.id" v-if="docVisible(doc)">
              <b-card
                :img-src="docIcon(doc)"
                img-alt="Image"
                img-top
                tag="article"
                style="max-width: 20rem;"
                class="mb-2 doc-tile"
              >
                <div class="detail-container">
                  <h5 class="card-title text-left">
                    {{ doc.metadata.title | truncate(40) }}
                  </h5>

                  <b-card-text class="mt-3">
                    <table
                      v-if="editTag == null || (editTag && editTag != doc)"
                      style="text-align: left; font-size: 12px"
                    >
                      <template v-if="doc.organization"
                        ><tr>
                          <td>Company</td>
                          <td class="pl-2">{{ doc.organization.name }}</td>
                        </tr></template
                      >
                      <tr>
                        <td>Created</td>
                        <td class="pl-2">
                          {{ doc.createdBy.username | truncate }}
                          {{ new Date(doc.createdOn).toLocaleDateString(locale) }}
                        </td>
                      </tr>
                      <template v-if="doc.lastModifiedOn"
                        ><tr>
                          <td>Modified</td>
                          <td class="pl-2">
                            {{ doc.lastModifiedBy ? doc.lastModifiedBy.username : "" | truncate }}
                            {{ new Date(doc.lastModifiedOn).toLocaleDateString(locale) }}
                          </td>
                        </tr></template
                      >
                    </table>

                    <div class="d-inline-flex text-left w-100">
                      <div
                        v-if="editTag == null || (editTag && editTag != doc)"
                        class="text-left mt-3 w-100"
                        style="margin-left:-3px"
                      >
                        <div v-if="doc.tags && doc.tags != ''" class="">
                          <button-tag
                            v-for="item in doc.tags.split(',')"
                            @tag-clicked="tagClicked"
                            :key="item"
                            :classList="
                              `pill border-primary d-inline-flex text-primary border p-1 btn-sm text-sm mb-1 ml-1 px-2`
                            "
                            :item="item"
                            :startWith="'#'"
                          ></button-tag>
                          <div
                            class="pill border-success d-inline-flex text-success border p-1 btn-sm text-sm btn-small mb-1 ml-1 px-2"
                            v-b-tooltip.hover="{ title: 'Edit tags' }"
                            role="button"
                            @click="
                              editTag = doc;
                              tagsArray = doc.tags.split(',');
                            "
                          >
                            &#8203;<v-icon class="ml-1" name="pen"></v-icon>
                          </div>
                        </div>
                        <div v-else>
                          <div
                            class="pill border-secondary d-inline-flex text-secondary border p-1 btn-sm text-sm btn-small mb-1 ml-1 px-2"
                            v-b-tooltip.hover="{
                              title: 'Use tags to organize your projects'
                            }"
                            role="button"
                          >
                            #Tag
                          </div>
                          <div
                            class="pill border-success d-inline-flex text-success border p-1 btn-sm text-sm btn-small mb-1 ml-1 px-2"
                            v-b-tooltip.hover="{ title: 'Edit tags' }"
                            role="button"
                            @click="
                              editTag = doc;
                              tagsArray = doc.tags.split(',');
                            "
                          >
                            &#8203;<v-icon class="ml-1" name="pen"></v-icon>
                          </div>
                        </div>
                      </div>
                      <div v-else-if="editTag == doc">
                        <div class="w-100 px-1">
                          <vue-tags-input
                            v-model="tag"
                            :max-tags="maxTagsLength"
                            @max-tags-reached="toastValidationError"
                            @adding-duplicate="toastValidationError"
                            :tags="tags"
                            :autocomplete-items="selectedTagsAutoComplete"
                            :delete-on-backspace="true"
                            :validation="validation"
                            :placeholder="'Tags...'"
                            @tags-changed="
                              (newTags) =>
                                (tagsArray = newTags.map((t) => {
                                  return t.text;
                                }))
                            "
                          />
                        </div>
                      </div>
                    </div>
                  </b-card-text>
                </div>
                <div class="text-center mt-3 " v-if="editTag == null || (editTag && editTag != doc)">
                  <b-button
                    @click="openDoc(doc.id)"
                    variant="primary"
                    text="Open"
                    @contextmenu.prevent="contextMenu(doc.id, $event)"
                    class="d-inline-flex "
                    no-caret
                  >
                    Open
                  </b-button>
                  <b-button
                    @click="clone(doc)"
                    class=" btn ml-2 btn-secondary"
                    v-b-tooltip.hover="{ title: 'Make a copy of your project' }"
                  >
                    <v-icon name="copy"></v-icon>
                  </b-button>
                  <b-button
                    v-if="canDeleteDoc(doc)"
                    @click="deleteDoc(doc)"
                    v-b-tooltip.hover="{ title: 'Delete project' }"
                    class="ml-2 btn btn-danger"
                  >
                    <v-icon name="trash"></v-icon>
                  </b-button>

                  <b-button
                    v-if="canRestoreDoc(doc)"
                    @click="restoreDoc(doc)"
                    v-b-tooltip.hover="{ title: 'Restore project' }"
                    class="ml-2 btn btn-success"
                  >
                    <v-icon name="redo"></v-icon>
                  </b-button>
                  <span
                    class="d-inline-flex ml-3 m-2 circle-border border border-primary rounded-circle  text-primary ml-2"
                    v-if="doc.metadata.description"
                    v-b-tooltip.hover="{ title: doc.metadata.description }"
                  >
                    <v-icon name="info"></v-icon>
                  </span>
                </div>
                <div class="mt-3 text-center" v-else>
                  <b-button
                    @click="
                      editTag = null;
                      tag = '';
                    "
                    v-b-tooltip.hover="{ title: 'Discard tag changes' }"
                    class=" btn btn-danger"
                  >
                    <v-icon name="ban"></v-icon>
                  </b-button>
                  <b-button
                    @click="saveTags(doc)"
                    v-b-tooltip.hover="{ title: 'Save tags' }"
                    class="ml-2 btn btn-success"
                  >
                    <v-icon name="save"></v-icon>
                  </b-button>
                </div>
                <div class="text-right mt-1" v-if="canViewReportingStatus()" v-b-tooltip.hover.right :title="reportingStatusString(doc)">
                  <b-badge v-if="reportingStatus(doc)" variant="success">Rx</b-badge>
                  <b-badge v-else class="text-muted" variant="light"><s>Rx</s></b-badge>
                </div>
              </b-card>
            </b-col>
          </template>
        </b-row>
        <b-row>
          <span v-if="showTruncatedWarning">
            Results truncated to {{ ADMIN_MAX_DISPLAY_COUNT }} documents.
          </span>
        </b-row>
      </b-container>
    </div>
    <Onboarding :screen="onboardingScreen"></Onboarding>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import VueTagsInput from "@johmun/vue-tags-input";
import {
  canUserDeleteDocument,
  canUserRestoreDocument,
  Document,
  DocumentStatus
} from "../../../common/src/models/Document";
import ReportingFilter, { ReportingStatus } from "../../../common/src/reporting/ReportingFilter";
import {
  cloneDocument,
  createDocument,
  deleteDocument,
  updateDocument,
  getDocuments,
  restoreDocument
} from "../api/document";
import { getChangeLogMessages, saveChangeLogMessage } from "../api/change-log";
import { updateLastNoticeSeen } from "../api/users";
import { AccessLevel, User } from "../../../common/src//models/User";
import { assertUnreachable, CURRENT_VERSION } from "../../../common/src//api/config";
import { ChangeLogMessage } from "../../../common/src//models/ChangeLogMessage";
import { ONBOARDING_SCREEN } from "../store/onboarding/types";
import MainNavBar from "../../src/components/MainNavBar.vue";
import Onboarding from "../../src/components/Onboarding.vue";
import LocaleSelector from "../components/LocaleSelector.vue";
import { SupportedLocales } from "../../../common/src//api/locale";
import ButtonTag from "../components/tags/ButtonTag.vue";
import { getDirective } from 'vue-debounce'
import * as _ from "lodash";
import contextMenu from "vue-context-menu";
import vueDebounce from 'vue-debounce'

Vue.use(vueDebounce)

enum ProjectTabFilters {
  MY_PROJECTS = 0,
  ORGANIZATION_PROJECTS = 1,
  ALL_PROJECTS = 2
}

@Component({
  components: {
    LocaleSelector,
    MainNavBar,
    Onboarding,
    ButtonTag,
    VueTagsInput,
    contextMenu,
  },
  directives: {
    debounce: getDirective()
  },
})
export default class Home extends Vue {
  allDocuments: Document[] = [];
  filteredDocuments: Document[] = [];
  loaded: boolean = false;
  showDeleted: boolean = false;
  hasNewChangeLogs: boolean = true;
  compiledChangeLogs: ChangeLogMessage[] = [];
  selectedTags: string[] = [];
  projectFilter: number = ProjectTabFilters.MY_PROJECTS;
  showTruncatedWarning: boolean = false;  
  searchCondition: string = "";
  contextId: number = 0;
  editTag: any = null;
  tag: string = "";
  positionX: number = 0;
  maxTagsLength = 10;
  positionY: number = 0;
  tagsArray: string[] = [];
  validation: any = [
    {
      disableAdd: true,
      classes: "no-class",
      rule: (newTag: any) => !this.isTagValid(newTag)
    }
  ];
  ADMIN_MAX_DISPLAY_COUNT = 100;
  isTagValid(newTag: any) {
    return (
      (this.filterArray(this.tagsArray, newTag.text).length == 0 && this.tagsArray.length < this.maxTagsLength) ||
      this.tag.trim() === ""
    );
  }
  mounted(): void {
    this.reloadDocuments();
    this.getChangeLogs();
  }
  changeTab(tab: ProjectTabFilters) {
    this.selectedTags = [];
    this.projectFilter = tab;
    this.filterDocuments();
  }
  tagClicked(tag: string) {
    this.selectedTags.indexOf(tag) == -1
      ? this.selectedTags.push(tag)
      : this.selectedTags.splice(this.selectedTags.indexOf(tag), 1);

    this.filterDocuments();
  }
  contextMenu(docId: number, $event: any) {
    this.contextId = docId;
    (this.$refs.ctxMenu as any).open();
  }

  openOnNewTab(docPath: string) {
    window.open(docPath);
  }

  filterDocuments(){

    const applyTabFilter = (doc: Document) => {
      return (
        this.profile &&
        (this.projectFilter === ProjectTabFilters.MY_PROJECTS &&
          doc.createdBy.username === this.profile.username) ||
        (this.projectFilter === ProjectTabFilters.ORGANIZATION_PROJECTS &&
          this.profile!.organization!.id == doc!.organization!.id) ||
        this.projectFilter === ProjectTabFilters.ALL_PROJECTS
      );
    }

    const applySearchCondition = (doc: Document) => {
      return (
        !this.searchCondition || 
        (
          this.searchCondition &&
          this.searchCondition.length > 2 &&
          (this.containsText(doc.metadata.title, this.searchCondition) ||
          this.containsText(doc.organization.name, this.searchCondition) ||
          this.containsText(doc.createdBy.username, this.searchCondition) ||
          this.containsText(doc.tags, this.searchCondition) ||
          doc.id.toString() === this.searchCondition)
        )
      );
    }

    const applyTagFilter = (doc: Document) => {
      return this.selectedTags.length == 0 || (this.selectedTags.length > 0 && this.containsTag(doc));
    }

    const applyDeleteFilter = (doc: Document): boolean => {
      return ( this.profile.accessLevel <= AccessLevel.MANAGER && this.showDeleted ) || ( doc.state != DocumentStatus.DELETED )
    }


    let docs = this.allDocuments.filter((doc: Document) => {
      return applyTabFilter(doc) && applySearchCondition(doc) && applyTagFilter(doc) && applyDeleteFilter(doc);
    });

    if (this.projectFilter == ProjectTabFilters.ALL_PROJECTS && docs.length > this.ADMIN_MAX_DISPLAY_COUNT ) {
      docs = docs.slice(0, this.ADMIN_MAX_DISPLAY_COUNT)
      this.showTruncatedWarning = true;
    } else {
      this.showTruncatedWarning = false;
    }

    this.filteredDocuments = docs;
  }
  get tags() {
    return this.editTag.tags
      .split(",")
      .filter((item: string) => {
        return item && item != "";
      })
      .map((item: string) => ({ text: item }));
  }
  filterArray(array: string[], condition: string, contain: boolean = false) {
    return array.filter((item: string) => {
      return item.toLowerCase().indexOf(condition.toLowerCase()) != -1 && (item.length == condition.length || contain);
    });
  }

  containsText(text: string, condition: string) {
    return text.toLowerCase().indexOf(condition.toLowerCase()) != -1;
  }

  get selectedTagsAutoComplete() {
    if (this.tag.length < 3) return [];
    return this.filterArray(this.documentTags, this.tag, true)
      .filter((item) => {
        return this.isTagValid({ text: item });
      })
      .map((item: string) => {
        return { text: item };
      });
  }

  get documentTags() {
    var docTags = this.filteredDocuments
      .map((item) => {
        return item.tags;
      })
      .filter((item) => {
        return item != "";
      });
    let arr: string[] = [];
    docTags.forEach((item: string) => {
      if (item) {
        let currentArray = item.split(",");
        currentArray.forEach((i) => {
          if (arr.indexOf(i) == -1) arr.push(i);
        });
      }
    });
    return arr
      .map((item) => {
        return item;
      })
      .filter((value: string, index: number, self: any) => {
        return self.indexOf(value) === index;
      })
      .sort();
  }

  toastValidationError() {
    if (!this.isTagValid({ text: this.tag })) {
      this.$bvToast.toast(
        this.tagsArray.length >= this.maxTagsLength
          ? `Maximum number of tags exceeded`
          : `The tag ${this.tag} is invalid or repeated`,
        {
          variant: "danger",
          title: "Invalid tag"
        }
      );
      return false;
    }
    return true;
  }
  saveTags(doc: Document) {
    this.tag = this.tag.trim();
    if (!this.toastValidationError()) return;
    if (this.tag && this.tag != "") this.tagsArray.push(this.tag);

    doc.tags = this.tagsArray
      .map((item) => {
        return item.trim();
      })
      .filter((item) => {
        return item && item != "";
      })
      .join(",");

    this.editTag = null;
    this.tag = "";
    this.updateDoc(doc);
  }
  containsTag(doc: Document) {
    if (!doc.tags) return false;
    return (
      doc.tags.split(",").filter((tag: string) => {
        return this.selectedTags.indexOf(tag) != -1;
      }).length >= this.selectedTags.length
    );
  }
  get onboardingScreen() {
    return ONBOARDING_SCREEN.HOME;
  }

  get profile(): User {
    return this.$store.getters["profile/profile"];
  }

  get locale(): SupportedLocales {
    return this.$store.getters["profile/locale"];
  }
  docIcon(doc: Document) {
    switch (doc.state) {
      case DocumentStatus.ACTIVE:
        if (doc.version !== CURRENT_VERSION) {
          return require("../assets/pending.png");
        } else {
          return require("../assets/blueprint-architecture.png");
        }
      case DocumentStatus.DELETED:
        return require("../assets/deleted.png");
      case DocumentStatus.PENDING:
        return require("../assets/pending.png");
      default:
        assertUnreachable(doc.state);
    }
  }

  docVisible(doc: Document) {
    switch (doc.state) {
      case DocumentStatus.ACTIVE:
      case DocumentStatus.DELETED:
        return true;
      case DocumentStatus.PENDING:
        return this.profile.accessLevel <= AccessLevel.ADMIN;
      default:
        assertUnreachable(doc.state);
    }
  }

  get AccessLevel() {
    return AccessLevel;
  }
  get ProjectTabFilters() {
    return ProjectTabFilters;
  }
  reloadDocuments() {
    // fill documents
    getDocuments().then((res) => {
      if (res.success) {
        this.allDocuments = res.data;
        this.allDocuments.forEach((item) => { item.tags = item.tags || "" });        
        this.filterDocuments();
        this.loaded = true;
      } else {
        this.$bvToast.toast(res.message, {
          variant: "danger",
          title: "Error retrieving document list"
        });
      }
    });
  }

  toggleShowDeleted() {
    this.showDeleted = !this.showDeleted;
    this.filterDocuments();
  }

  handleCreateDocument() {
    createDocument(this.locale).then((res) => {
      if (res.success) {
        this.$router.push(`/document/${res.data.id}/0`);
      } else {
        this.$bvToast.toast(res.message, {
          variant: "danger",
          title: "Error creating new document"
        });
      }

      this.$store.dispatch("profile/refreshOnBoardingStats");
    });
  }

  canDeleteDoc(doc: Document) {
    if (!this.profile) {
      return false;
    }

    return canUserDeleteDocument(doc, this.profile);
  }

  canViewReportingStatus() {
    return this.profile && this.profile.accessLevel <= AccessLevel.ADMIN;
  }

  reportingStatus(doc: Document) {
    return ReportingFilter.autoIncludedStatus(doc) === ReportingStatus.Included;
  }

  reportingStatusString(doc: Document) {
    return ReportingFilter.includedStatusString(doc);
  }

  canRestoreDoc(doc: Document) {
    if (!this.profile) {
      return false;
    }

    return canUserRestoreDocument(doc, this.profile);
  }
  async updateDoc(doc: Document) {
    const res = await updateDocument(doc.id, undefined, doc.metadata, doc.tags);
    if (!res.success) {
      this.$bvToast.toast(res.message, {
        variant: "danger",
        title: "Failed to update Project"
      });
    }
  }
  async deleteDoc(doc: Document) {
    const confirm = await this.$bvModal.msgBoxConfirm(
      'Are you sure you want to delete the document "' + doc.metadata.title + '"?'
    );
    if (confirm) {
      const res = await deleteDocument(doc.id);
      if (res.success) {
        this.reloadDocuments();
      } else {
        this.$bvToast.toast(res.message, {
          variant: "danger",
          title: "Failed to Delete Project"
        });
      }
    }
  }
  openDoc(documentId: number) {
    this.$router.push(`/document/${documentId}/1`);
  }
  async restoreDoc(doc: Document) {
    const res = await restoreDocument(doc.id);
    if (res.success) {
      this.reloadDocuments();
    } else {
      this.$bvToast.toast(res.message, {
        variant: "danger",
        title: "Failed to Restore Project"
      });
    }
  }

  async clone(doc: Document) {
    if (this.profile) {
      const res = await cloneDocument(doc.id);
      if (res.success) {
        this.reloadDocuments();
      } else {
        this.$bvToast.toast(res.message, {
          variant: "danger",
          title: "Error Making Copy"
        });
      }
    } else {
      this.$bvToast.toast("You need to be part of an organization to store projects", {
        variant: "danger",
        title: "Cannot Make Copy"
      });
    }
  }

  async getChangeLogs() {
    const res = await getChangeLogMessages(this.profile.lastNoticeSeenOn);
    if (res.success && res.data.length > 0) {
      this.hasNewChangeLogs = true;
      this.compiledChangeLogs = res.data;
      this.$bvModal.show("modal-1");
      setTimeout(() => {
        updateLastNoticeSeen();
        this.profile.lastNoticeSeenOn = new Date();
      }, 10000); // wait for client to update before claiming that it was updated.
    }
  }

  changeLogModalHidden() {
    updateLastNoticeSeen();
    this.profile.lastNoticeSeenOn = new Date();
  }
}
</script>
<style lang="less" scoped>
h1 {
  padding-top: 50px;
}

.doc-tile img {
  max-height: 75px;
  object-fit: contain;
}

.isEmailVerification {
  height: calc(100vh - 102px) !important;
}
.circle-border {
  height: 24px;
  width: 24px;
  text-align: center;
  padding-left: 8px;
  padding-top: 2px;
}
.circle-border-md {
  display: inline-block !important;
  text-align: center;
}
.card-title {
  font-size: 1.1rem;
}
.card-body {
  padding: 1rem;
}
.rounded-border {
  border-radius: 40px;
}
.detail-container {
  height: 12rem;
  overflow-y: auto;
}

::-webkit-scrollbar {
  -webkit-appearance: none;
  width: 3px;
  height: 3px;
  margin-left: 10px;
  margin-right: -5px;
}

::-webkit-scrollbar-thumb {
  border-radius: 4px;
  height: 3px;
  background-color: rgba(0, 132, 255, 0.5);
  box-shadow: 0 0 1px rgba(255, 255, 255, 0.5);
}
.context-link {
  text-decoration: none;
  margin: 10px;
  cursor: pointer;
}
</style>
