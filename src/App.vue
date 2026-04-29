<template>
  <div class="container">
    <el-container>
      <el-main>
        <div v-if="hasData">
          <ControlPanel
            v-model:fromNum="fromNum"
            v-model:toNum="toNum"
            v-model:searchText="searchText"
            :t="t"
            :hasSelected="selectedData.length > 0"
            @select-from-to="selectFromTo"
            @search-filename="searchFilename"
            @search-clear="clean"
            @fetch-document="fetchDocument"
            @select-all="selectAll"
            @select-opposite="selectOpposite"
            @copy="copy"
            @download="download"
            @clean="clean"
          />

          <LinkTable
            ref="linkTableRef"
            v-model:activeName="activeName"
            :types="TYPES"
            :ed2kLinks="ed2kLinks"
            :magnetLinks="magnetLinks"
            :fileLinks="fileLinks"
            @tab-change="clean"
            @selection-change="val => selectedData = val"
          />
        </div>

        <div v-else>
          <el-row>
            <el-col :span="8">
              <div class="grid-content bg-purple"></div>
            </el-col>
            <el-col :span="8">
              <div class="grid-content bg-purple-light">
                <span i18n="no_data">{{ t('no_data') }}</span>
                <el-button type="warning" :icon="RefreshLeft" @click="fetchDocument" circle></el-button>
              </div>
            </el-col>
            <el-col :span="8"></el-col>
          </el-row>
        </div>
      </el-main>

      <el-dialog
        v-model="copyDialogVisible"
        :title="t('copy_success')"
        width="90%"
      >
        <el-input v-model="copyText" autosize type="textarea" :placeholder="t('result_copy')" />

        <template #footer>
          <span class="dialog-footer">
            <el-button type="success" @click="copyToClipboard">{{ t("button_confirmcopy") }}</el-button>
            <el-button type="primary" @click="copyDialogVisible = false">{{ t("confirm_scope") }}</el-button>
          </span>
        </template>
      </el-dialog>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { RefreshLeft } from "@element-plus/icons-vue"
import ControlPanel from './components/ControlPanel.vue'
import LinkTable from './components/LinkTable.vue'
import { useLinkExtractor, TYPES } from './composables/useLinkExtractor'
import { useTableSelection } from './composables/useTableSelection'

const {
  magnetLinks,
  ed2kLinks,
  fileLinks,
  base_magnetLinks,
  base_ed2kLinks,
  base_fileLinks,
  activeName,
  hasData,
  t,
  fetchDocument,
  sendToContentScript
} = useLinkExtractor()

const {
  selectedData,
  fromNum,
  toNum,
  searchText,
  copyDialogVisible,
  copyText,
  tableRefs,
  clean,
  searchFilename,
  selectFromTo,
  selectAll,
  selectOpposite,
  copy,
  download,
  copyToClipboard
} = useTableSelection(magnetLinks, ed2kLinks, fileLinks, base_magnetLinks, base_ed2kLinks, base_fileLinks, activeName)

const linkTableRef = ref<any>(null)

// Sync table refs from child component
watch(() => linkTableRef.value?.tableRefs, (newRefs) => {
  if (newRefs) {
    tableRefs.value = newRefs
  }
}, { deep: true, immediate: true })

onMounted(() => {
  sendToContentScript({ dispatch: "dev" })
  if (linkTableRef.value) {
    tableRefs.value = linkTableRef.value.tableRefs
  }
})
</script>

<style scoped lang="less">
</style>
