import { ref, watch } from 'vue'
import _ from 'lodash'
import { TYPES } from './useLinkExtractor'

export function useTableSelection(
  magnetLinks: any,
  ed2kLinks: any,
  base_magnetLinks: any,
  base_ed2kLinks: any,
  activeName: any
) {
  const selectedData = ref<any[]>([])
  const fromNum = ref(0)
  const toNum = ref(0)
  const searchText = ref("")
  const copyDialogVisible = ref(false)
  const copyText = ref("")

  // Refs for tables (will be set by the component)
  const tableRefs = ref<Record<string, any>>({})

  const getCurrentTableDataKey = () => `${activeName.value}Links`
  
  const getCurrentTableData = () => {
    if (activeName.value === 'ed2k') return ed2kLinks.value
    return magnetLinks.value
  }

  const setCurrentTableData = (data: any[]) => {
    if (activeName.value === 'ed2k') {
      ed2kLinks.value = data
    } else {
      magnetLinks.value = data
    }
  }

  const resetAllTable = () => {
    ed2kLinks.value = [...base_ed2kLinks.value]
    magnetLinks.value = [...base_magnetLinks.value]
  }

  const clean = () => {
    fromNum.value = 0
    toNum.value = 0
    resetAllTable()
    searchText.value = ""
    selectedData.value = []

    for (let type of TYPES) {
      const ref = tableRefs.value[`${type}TableRef`]
      if (ref) ref.clearSelection()
    }
  }

  const searchFilename = () => {
    let text = searchText.value
    if (text.length < 1) {
      resetAllTable()
      return
    }
    let data = getCurrentTableData()
    let newData = _.filter(data, (d) => d.fileName.indexOf(text) > 0)
    setCurrentTableData(newData)
  }

  const selectFromTo = () => {
    const from = fromNum.value
    const to = toNum.value

    if (from >= to) {
      alert("from must less than to selection")
      return
    }
    
    const tableData = getCurrentTableData()
    if (to > tableData.length) {
      alert("to selection cannot bigger than list total length")
      return
    }

    const tableKey = `${activeName.value}TableRef`
    const ref = tableRefs.value[tableKey]
    if (ref) {
      ref.clearSelection()
      for (let i = from; i <= to; i++) {
        ref.toggleRowSelection(tableData[i])
      }
    }
  }

  const selectAll = () => {
    const tableKey = `${activeName.value}TableRef`
    const ref = tableRefs.value[tableKey]
    if (ref) {
      ref.clearSelection()
      ref.toggleAllSelection()
    }
  }

  const selectOpposite = () => {
    const tableKey = `${activeName.value}TableRef`
    const ref = tableRefs.value[tableKey]
    if (ref) {
      ref.toggleAllSelection()
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(copyText.value)
      alert("copy success!")
    } catch (err) {
      alert(`Somthing Error: ${JSON.stringify(err)} `)
    }
  }

  const copy = async () => {
    if (selectedData.value.length < 1) {
      alert("you should select at lease one item!")
      return
    } else {
      const result = _.map(selectedData.value, (data) => data.link).join("\r\n")
      copyText.value = result
      await copyToClipboard()
      copyDialogVisible.value = true
    }
  }

  return {
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
    copyToClipboard
  }
}
