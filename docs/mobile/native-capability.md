# 🔌 原生能力进阶：Bridge 能力清单与权限流

> 混合/H5 开发里，H5 自身拿不到的能力（定位、相册、相机、推送、生物识别…）都要通过 Bridge 调原生。本篇给出**常用原生能力的调用规范、权限流、平台差异与坑**，供前端在 Bridge 协议上落地具体能力。前置：[H5 + WebView 桥协议](h5-webview.md) §四、[uni-app 混合开发](uniapp-vue3-webview.md)、[安全专项](security.md)。
>
> 依据：**Apple — 隐私权限文档**（Location/Photo/Camera）、**Android — 运行时权限**、**微信 JS-SDK 官方**。

---

## 一、能力清单（H5 → 原生调什么）

| 能力 | 平台 API | 前端调用示意 | 关键注意 |
|------|----------|--------------|----------|
| 定位 | iOS `CLLocationManager` / Android `FusedLocationProvider` | `bridge.call('getLocation')` | 需授权，类型 wgs84/gcj02 |
| 相册/相机 | `UIImagePickerController` / `Intent(MediaStore)` | `bridge.call('chooseImage')` | 相册/相机分别授权 |
| 扫码 | 原生扫码引擎 | `bridge.call('scanCode')` | 相机权限 |
| 推送 | APNs / FCM / 厂商通道 | 原生注册，H5 只需 `getPushToken` | 需原生配置证书 |
| 文件/下载 | 原生文件管理 | `bridge.call('openFile')` | 存储权限（Android） |
| 生物识别 | iOS `FaceID/TouchID(LocalAuthentication)` / Android Biometric | `bridge.call('biometricAuth')` | 设备支持度不同 |
| 剪贴板 | `UIPasteboard` / `ClipboardManager` | `bridge.call('getClipboard')` | 隐私：静读剪贴板被系统提示 |
| 相机/麦克风 | 同上 | `bridge.call('startRecord')` | 需授权 |
| 设备信息 | `UIDevice` / `Build` | `bridge.call('getDeviceInfo')` | 合规：脱敏（见 [合规](a11y-compliance.md) §七） |
| 分享 | 原生分享面板 | `bridge.call('share', {...})` | 各 App 分享通道不同 |

---

## 二、权限流（统一模型）

所有敏感能力遵循**"检测 → 申请 → 处理拒绝"**：

```js
async function callProtectedCapability(method) {
  const status = await bridge.call('checkPermission', { method })  // 查当前授权
  if (status === 'granted') return bridge.call(method)
  if (status === 'denied') {
    // 用户曾拒绝：引导去设置页（原生开设置）
    return bridge.call('openSetting')
  }
  // 首次：申请
  const r = await bridge.call('requestPermission', { method })
  if (!r.granted) throw new Error('permission denied')
  return bridge.call(method)
}
```

!!! danger "坑 1：Android 权限被永久拒绝无法再弹"
    Android 上用户选"不再询问"后 `requestPermission` 直接返回 denied 且**不再弹窗**。此时必须引导去系统设置页重新开（`bridge.call('openSetting')`），H5 不能只调一次就放弃。

!!! danger "坑 2：iOS 定位后台/精度权限细分"
    iOS 13+ 有**精确/模糊位置**（`Allow Once` / `When In Use` / `Always`）。`Always` 极难获审，普通业务用 `When In Use`；高精度需求（导航）才申请 `Always` 并说明用途。

---

## 三、定位（最常用，坑最多）

```js
bridge.call('getLocation', { type: 'gcj02' })  // 国内用 gcj02（火星坐标）
```

- **坐标系**：国内地图用 `gcj02`；GPS 原始是 `wgs84`。混用会导致偏移几百米（经典坑）。
- **iOS 后台定位**：需 `NSLocationAlwaysAndWhenInUseUsageDescription` + 后台模式，审核严。
- **Android**：`ACCESS_FINE_LOCATION`（精）/ `ACCESS_COARSE_LOCATION`（粗），6.0+ 运行时申请。

!!! tip "最佳实践"
    只取必要精度；持续定位用完立即 `stopUpdatingLocation`，否则耗电被系统杀。

---

## 四、相册/相机

```js
bridge.call('chooseImage', { count: 1, sourceType: ['album', 'camera'] })
```

- **相册权限**：iOS `NSPhotoLibraryUsageDescription`；Android `READ_EXTERNAL_STORAGE`（13+ 改 `READ_MEDIA_IMAGES`）。
- **保存图片**：iOS 写相册需 `NSPhotoLibraryAddUsageDescription`（只写不需读权限）。
- **坑**：Android 13+ 媒体权限拆分（images/video/audio），按类型申请，别申请全量。

---

## 五、推送（Push）

- iOS：APNs 需证书/p8；H5 不直接注册，原生注册后把 `deviceToken` 回传给 H5/服务端。
- Android：FCM（海外）或厂商通道（国内：小米/华为/OPPO/vivo），各厂商 SDK 接入。
- **点击推送跳转**：推送 payload 带 `page` 参数，原生收到点击 → 打开 web-view 带 `src?page=...`（见 [H5 路由](h5-webview.md) §五）。

!!! warning "统一推送网关"
    多厂商通道参数不一致，建议服务端用**统一推送网关**（如个推/极光）屏蔽差异，前端只关心 `deviceToken`。

---

## 六、生物识别（登录/支付）

```js
bridge.call('biometricAuth', { reason: '指纹登录' })
```

- iOS：`LocalAuthentication`（TouchID/FaceID），需 `NSFaceIDUsageDescription`。
- Android：`BiometricPrompt`（指纹/面部），Android 6.0+。
- **不要只靠生物识别作为唯一凭据**：生物识别只做"本地解锁"，最终鉴权仍走服务端 token（安全，见 [安全专项](security.md)）。

---

## 七、剪贴板与设备信息（隐私敏感）

- **剪贴板**：iOS 14+ 读剪贴板会**顶部提示用户**（隐私），别静默轮询读剪贴板（会骚扰且上架风险）。只在用户主动"粘贴"时读。
- **设备信息**：IMEI/IDFA 在 iOS 受限（IDFA 需 ATT 弹窗）；用**匿名设备 ID**（服务端生成或 IDFV）。采集需符合 [隐私合规](a11y-compliance.md) §七。

---

## 八、速查：原生能力问题 → 排查

| 现象 | 根因 | 方案 |
|------|------|------|
| 定位偏移 | wgs84/gcj02 混用 | 统一 gcj02（国内） |
| 权限弹不出 | Android 永久拒绝 | 引导去设置页 |
| 相册打不开 | 13+ 媒体权限拆分 | 按 images 申请 |
| 推送收不到 | 证书/通道错 | 校验 APNs/厂商通道 |
| 剪贴板提示 | iOS 静读 | 用户主动粘贴时读 |
| 生物识别被拒 | 作唯一凭据 | 仅本地解锁，鉴权走 token |

---

## 九、章节关联

- Bridge 协议/鉴权 → [H5 + WebView 桥协议](h5-webview.md) §四、[安全专项](security.md)
- uni-app 内调原生 → [uni-app 混合开发](uniapp-vue3-webview.md)
- 隐私合规 → [无障碍与合规](a11y-compliance.md) §七
