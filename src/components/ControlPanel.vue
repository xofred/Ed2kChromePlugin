<template>
  <el-row>
    <el-col :span="16">
      <el-form :inline="true">
        <el-form-item :label="t('select_scope')">
          <el-input-number v-model="fromNum" :controls="false" size="mini"></el-input-number>
          -
          <el-input-number v-model="toNum" :controls="false" size="mini"></el-input-number>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="$emit('select-from-to')" size="mini">
            {{ t("confirm_scope") }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-col>
  </el-row>

  <el-row>
    <el-col :span="6">
      <el-form :inline="true">
        <el-form-item :label="t('search_filename')">
          <el-input
            v-model="searchText"
            size="mini"
            placeholder="filename"
            @keyup="$emit('search-filename')"
            clearable
            @clear="$emit('search-clear')"
          />
        </el-form-item>
      </el-form>
    </el-col>

    <el-col :span="12">
      <el-button class="btn-refresh" type="warning" @click="$emit('fetch-document')" size="mini">{{ t("refresh") }}</el-button>
      <el-button class="btn-select-all" type="primary" @click="$emit('select-all')" size="mini">{{ t("button_selectall") }}</el-button>
      <el-button class="btn-select-opposite" type="primary" @click="$emit('select-opposite')" size="mini">{{ t("button_selectopposite") }}</el-button>
      <el-button v-if="hasSelected" class="btn-copy" type="success" size="mini" @click="$emit('copy')">copy</el-button>
      <el-button v-if="hasSelected" class="btn-download" type="success" size="mini" @click="$emit('download')">Download</el-button>
      <el-button v-if="hasSelected" class="btn-clean" type="danger" @click="$emit('clean')" size="mini">{{ t("clean_scope") }}</el-button>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  t: (key: string) => string
  fromNum: number
  toNum: number
  searchText: string
  hasSelected: boolean
}>()

const emit = defineEmits([
  'update:fromNum',
  'update:toNum',
  'update:searchText',
  'select-from-to',
  'search-filename',
  'search-clear',
  'fetch-document',
  'select-all',
  'select-opposite',
  'copy',
  'download',
  'clean'
])

const fromNum = computed({
  get: () => props.fromNum,
  set: (val) => emit('update:fromNum', val)
})

const toNum = computed({
  get: () => props.toNum,
  set: (val) => emit('update:toNum', val)
})

const searchText = computed({
  get: () => props.searchText,
  set: (val) => emit('update:searchText', val)
})
</script>
