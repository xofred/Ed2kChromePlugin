<template>
  <el-tabs v-model="activeName" @tab-click="$emit('tab-change')">
    <el-tab-pane v-for="type in types" :key="type" :label="type" :name="type">
      <el-table
        :ref="(el: any) => setTableRef(type, el)"
        :data="getTableData(type)"
        striple
        fit
        style="width: 100%"
        max-height="600"
        @selection-change="val => $emit('selection-change', val)"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="sequence" label="#" width="60" />
        <el-table-column prop="fileName" label="file" width="500">
          <template #default="scope">
            <el-link type="primary" :href="scope.row.link" :underline="false">
              {{ scope.row.fileName }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column property="fileSize" label="size" />
      </el-table>
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  activeName: string
  types: string[]
  ed2kLinks: any[]
  magnetLinks: any[]
  fileLinks: any[]
}>()

const emit = defineEmits(['update:activeName', 'tab-change', 'selection-change'])

const activeName = computed({
  get: () => props.activeName,
  set: (val) => emit('update:activeName', val)
})

const tableRefs = ref<Record<string, any>>({})

const setTableRef = (type: string, el: any) => {
  if (el) {
    tableRefs.value[`${type}TableRef`] = el
  }
}

const getTableData = (type: string) => {
  if (type === 'ed2k') return props.ed2kLinks
  if (type === 'file') return props.fileLinks
  return props.magnetLinks
}

defineExpose({
  tableRefs
})
</script>
