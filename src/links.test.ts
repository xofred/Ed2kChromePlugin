import { describe, it, expect } from 'vitest'
import { ed2k_regex, magnet_regex, Ed2kLink, MagnetLink } from './types'

describe('链接解析正则', () => {
  it('应当匹配 ed2k 链接', () => {
    const text = 'Check out this file: ed2k://|file|example.txt|123456|ABCDEF1234567890ABCDEF1234567890|/'
    const matches = text.match(new RegExp(ed2k_regex))
    expect(matches).not.toBeNull()
    expect(matches![0]).toBe('ed2k://|file|example.txt|123456|ABCDEF1234567890ABCDEF1234567890|/')
  })

  it('应当匹配 magnet 磁力链接', () => {
    const text = 'Download: magnet:?xt=urn:btih:abcdef1234567890abcdef1234567890abcdef12&dn=example.zip'
    const matches = text.match(new RegExp(magnet_regex))
    expect(matches).not.toBeNull()
    expect(matches![0]).toContain('magnet:?xt=urn:btih:abcdef1234567890abcdef1234567890abcdef12')
  })
})

describe('链接处理类 (Link Classes)', () => {
  it('Ed2kLink 类应当能正确解析文件名和大小', () => {
    const link = 'ed2k://|file|test_file.mp4|10485760|d96752765365444e05417852c0099516|/'
    const ed2k = new Ed2kLink(link, 0)
    expect(ed2k.fileName).toBe('test_file.mp4')
    expect(ed2k.fileSize).toBe('10MB')
  })

  it('MagnetLink 类应当能从 dn 参数中提取文件名', () => {
    const link = 'magnet:?xt=urn:btih:ABCDEF1234567890&dn=MyMovie.mkv'
    const magnet = new MagnetLink(link, 0)
    expect(magnet.fileName).toBe('MyMovie.mkv')
  })
})
