import { ref, computed } from 'vue'
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
  magnet_dn_reg,
  magnet_xt_reg_with_no_end
} from '../types'
import localalsJSON from '../../public/_locales/en/messages.json'

export const TYPES = ["ed2k", "magnet"]

export function useLinkExtractor() {
  const documentBody = ref("")
  const magnetLinks = ref<MagnetLink[]>([])
  const ed2kLinks = ref<Ed2kLink[]>([])
  const base_magnetLinks = ref<MagnetLink[]>([])
  const base_ed2kLinks = ref<Ed2kLink[]>([])
  const activeName = ref(TYPES[0])

  const hasData = computed(() => magnetLinks.value.length > 0 || ed2kLinks.value.length > 0)

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

  const responseFunc = (body: DocumentContentType) => {
    documentBody.value = body.documentBody
    magnetLinks.value = genMagnetLinks(documentBody.value)
    ed2kLinks.value = genEd2kLinks(documentBody.value)

    if (ed2kLinks.value.length === 0 && magnetLinks.value.length > 0) {
      activeName.value = TYPES[1]
    }

    base_ed2kLinks.value = [...ed2kLinks.value]
    base_magnetLinks.value = [...magnetLinks.value]
  }

  const getCurrentTab = async (): Promise<chrome.tabs.Tab> => {
    // Try to find the active tab in the current window first
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    
    // If we don't have a tab, or it's an internal extension page, or we can't see the URL
    if (!tab || !tab.url || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('chrome://')) {
      const allTabs = await chrome.tabs.query({})
      
      // Find the first tab that is a real webpage
      const targetTab = allTabs.find(t => t.url && 
        !t.url.startsWith('chrome-extension://') && 
        !t.url.startsWith('chrome://') &&
        t.url !== 'about:blank')
      if (targetTab) return targetTab
    }
    
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
    base_magnetLinks,
    base_ed2kLinks,
    activeName,
    hasData,
    t,
    fetchDocument,
    sendToContentScript
  }
}
