/**
 * 为图片添加水印
 * @param canvas 原始画布
 * @param isDark 是否为暗色主题
 * @param version 版本号
 */
export const addWatermark = (
  canvas: HTMLCanvasElement,
  isDark: boolean,
  version: string,
  t: (key: string) => string
): HTMLCanvasElement => {
  // 创建一个新的画布，高度增加水印区域的高度
  const borderHeight = 80
  const newCanvas = document.createElement('canvas')
  newCanvas.width = canvas.width
  newCanvas.height = canvas.height + borderHeight

  const ctx = newCanvas.getContext('2d')
  if (!ctx) return canvas

  // 绘制原始图像内容到新画布
  ctx.drawImage(canvas, 0, 0)

  // 计算水印位置（在原始内容下方）
  const startY = canvas.height

  // 绘制边框背景
  ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'
  ctx.fillRect(0, startY, newCanvas.width, borderHeight)

  // 设置信息文字样式
  ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'

  // 添加信息
  const yPadding = 40
  const lineHeight = 24

  // 计算文本垂直居中的基准Y坐标
  const textBaselineY = startY + borderHeight / 2 + 4
  const upperTextY = textBaselineY - lineHeight / 2 + 4
  const lowerTextY = textBaselineY + lineHeight / 2 + 4

  // 品牌标识 (右对齐)
  ctx.font = 'bold 28px "Arial", sans-serif'
  const brandText = 'Zentrun'
  const brandWidth = ctx.measureText(brandText).width
  ctx.fillText(brandText, newCanvas.width - brandWidth - yPadding, upperTextY)

  // 版本信息 (右对齐)
  ctx.font = '16px "Arial", sans-serif'
  const versionInfo = 'v' + version
  const versionInfoWidth = ctx.measureText(versionInfo).width
  ctx.fillText(versionInfo, newCanvas.width - versionInfoWidth - yPadding, lowerTextY)

  // 时间信息 (左对齐)
  const now = new Date()
  const timeStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  ctx.fillText(timeStr, yPadding, upperTextY)
  // 绘制分隔线
  ctx.fillStyle = isDark ? 'rgba(200, 200, 200, 0.5)' : 'rgba(50, 50, 50, 0.5)'
  ctx.fillRect(0, startY, newCanvas.width, 1)
  // 提示文本 (左对齐)
  ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'
  ctx.fillText(t('common.watermarkTip'), yPadding, lowerTextY)

  return newCanvas
}
