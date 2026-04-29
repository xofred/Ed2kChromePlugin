import { ref, reactive, computed } from 'vue'
import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import _, { trim } from 'lodash'
import {
  DispatchMessageType,
  DocumentContentType,
  MagnetLink,
  ed2k_regex,
  magnet_regex,
  each_magnet_regex,
  Ed2kLink,
  FileLink,
  FILE_EXTENSIONS,
  magnet_dn_reg,
  magnet_xt_reg_with_no_end
} from '../types'
import localalsJSON from '../../public/_locales/en/messages.json'

export const TYPES = ["ed2k", "magnet", "file"]

export function useLinkExtractor() {
  const documentBody = ref("")
  const magnetLinks = ref<MagnetLink[]>([])
  const ed2kLinks = ref<Ed2kLink[]>([])
  const fileLinks = ref<FileLink[]>([])
  const base_magnetLinks = ref<MagnetLink[]>([])
  const base_ed2kLinks = ref<Ed2kLink[]>([])
  const base_fileLinks = ref<FileLink[]>([])
  const activeName = ref(TYPES[0])

  const hasData = computed(() => 
    magnetLinks.value.length > 0 || 
    ed2kLinks.value.length > 0 ||
    fileLinks.value.length > 0
  )

  const t = (messageName: string) => {
    let message: string = ""
    try {
      message = chrome.i18n.getMessage(messageName)
    } catch (error) {
      console.log("翻译出错: ", { key: messageName, error })
      message = (localalsJSON as any)[messageName]?.["message"] || messageName
    }
    return message
  }

  const getXtByMagLink = (magLink: string): string => {
    try {
      let match = magLink.match(new RegExp(magnet_xt_reg_with_no_end)) || []
      return match[1] || ""
    } catch (e) {
      console.log("magnetUri decode error:", { magLink, e })
      return ""
    }
  }

  const magLinkIsEquals = (link1: string, link2: string): boolean => {
    return getXtByMagLink(link1) === getXtByMagLink(link2)
  }

  const getXtSameATagName = ($: CheerioAPI, magnetLink: string): string => {
    let resp = ""
    const as = $(`a[href^='magnet']`)
    if (as.length > 0) {
      for (let a of as) {
        let aHref = $(a).attr("href") || ""
        if (aHref.length < 1) continue
        if (magLinkIsEquals(aHref, magnetLink)) {
          resp = $(a).text()
          break
        }
      }
    }
    return resp
  }

  const genMagnetLinks = (bodyString: string): MagnetLink[] => {
    bodyString = bodyString.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    let magnetLinksArray: string[] = bodyString.match(new RegExp(magnet_regex)) || []

    if (magnetLinksArray.length > 0) {
      magnetLinksArray = _.uniq(magnetLinksArray)
      magnetLinksArray = _.map(magnetLinksArray, (link) => {
        link = trim(link).replace("\"", "").replace("'", "")
        return link.endsWith("&") ? link.substring(0, link.length - 1) : link
      })

      let $ = cheerio.load(bodyString)
      const resp: MagnetLink[] = []
      
      for (let seq = 0; seq < magnetLinksArray.length; seq++) {
        const link = magnetLinksArray[seq]
        const aName = getXtSameATagName($, link)
        
        if (aName.length > 0) {
          resp.push(new MagnetLink(link, seq, aName))
          continue
        } else {
          try {
            const new_link = decodeURIComponent(link)
            const match = new_link.match(new RegExp(each_magnet_regex)) || []
            if (match && match[2]) {
              resp.push(new MagnetLink(link, seq, match[2]))
              continue
            }
          } catch (error) {
            console.error("error get dn=", error)
          }
        }
        resp.push(new MagnetLink(link, seq))
      }
      return resp
    }
    return []
  }

  const genEd2kLinks = (bodyString: string): Ed2kLink[] => {
    let ed2kLinksArray: string[] = bodyString.match(new RegExp(ed2k_regex)) || []
    let $ = cheerio.load(bodyString)

    if (ed2kLinksArray.length > 0) {
      ed2kLinksArray = _.uniq(ed2kLinksArray)
      const resp: Ed2kLink[] = []
      for (let seq = 0; seq < ed2kLinksArray.length; seq++) {
        const link = ed2kLinksArray[seq]
        const aQuery = $(`a[href="${link}"]`)
        if (aQuery.length > 0) {
          resp.push(new Ed2kLink(link, seq, aQuery.text()))
        } else {
          resp.push(new Ed2kLink(link, seq))
        }
      }
      return resp
    }
    return []
  }

  const genFileLinks = (bodyString: string, currentUrl: string): FileLink[] => {
    let $ = cheerio.load(bodyString)
    const as = $("a[href]")
    const resp: FileLink[] = []
    const seenLinks = new Set<string>()

    as.each((index, element) => {
      let href = $(element).attr("href") || ""
      if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("magnet:") || href.startsWith("ed2k:")) return

      try {
        // Resolve relative URLs
        const absoluteUrl = new URL(href, currentUrl).href
        const lowerUrl = absoluteUrl.toLowerCase()

        // Check for file extensions
        const isFile = FILE_EXTENSIONS.some(ext => {
          // Extension might be followed by query params
          const extIndex = lowerUrl.indexOf(ext.toLowerCase())
          if (extIndex === -1) return false
          
          const afterExt = lowerUrl.substring(extIndex + ext.length)
          return afterExt === "" || afterExt.startsWith("?") || afterExt.startsWith("&") || afterExt.startsWith("/")
        })

        if (isFile && !seenLinks.has(absoluteUrl)) {
          seenLinks.add(absoluteUrl)
          const text = $(element).text().trim()
          resp.push(new FileLink(absoluteUrl, resp.length, text))
        }
      } catch (e) {
        // Skip invalid URLs
      }
    })

    return resp
  }

  const responseFunc = async (body: DocumentContentType) => {
    documentBody.value = body.documentBody
    
    // Get current tab URL to resolve relative paths
    const tab = await getCurrentTab()
    const currentUrl = tab.url || ""

    magnetLinks.value = genMagnetLinks(documentBody.value)
    ed2kLinks.value = genEd2kLinks(documentBody.value)
    fileLinks.value = genFileLinks(documentBody.value, currentUrl)

    if (ed2kLinks.value.length === 0 && magnetLinks.value.length === 0 && fileLinks.value.length > 0) {
      activeName.value = "file"
    } else if (ed2kLinks.value.length === 0 && magnetLinks.value.length > 0) {
      activeName.value = TYPES[1]
    }

    base_ed2kLinks.value = [...ed2kLinks.value]
    base_magnetLinks.value = [...magnetLinks.value]
    base_fileLinks.value = [...fileLinks.value]
  }

  const getCurrentTab = async (): Promise<chrome.tabs.Tab> => {
    // 1. Check for test injection (Playwright environment)
    const urlParams = new URLSearchParams(window.location.search)
    const testTabId = urlParams.get('testTabId')
    
    if (testTabId) {
      try {
        const tab = await chrome.tabs.get(parseInt(testTabId))
        if (tab) return tab
      } catch (e) {
        console.error("Failed to get injected test tab:", testTabId, e)
      }
    }

    // 2. Standard production logic: find the active tab in the current window
    // Note: We only use activeTab permission, so we can only see the active tab of the current window.
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    return tab
  }

  const sendToContentScript = async (message: DispatchMessageType) => {
    let tab = await getCurrentTab()
    await chrome.tabs.sendMessage(tab.id!, message, responseFunc)
  }

  const fetchDocument = async () => {
    const message: DispatchMessageType = {
      dispatch: "getDocumentContent",
    }
    await sendToContentScript(message)
  }

  return {
    documentBody,
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
  }
}
