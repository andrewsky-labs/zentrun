import { notarize } from '@electron/notarize'

export default async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context
  const releaseFlag = process.env.build_for_release
  console.info('releaseFlag', releaseFlag)
  if (!releaseFlag) {
    console.info('Skipping notarization as build_for_release is not set')
    return
  }
  if (electronPlatformName !== 'darwin') {
    return
  }
  console.info('start notarize mac app', appOutDir)
  if (releaseFlag === '2') {
    // 使用预设的appid、teamid和环境变量中的密码
    const appleId = process.env.Zentrun_APPLE_NOTARY_USERNAME
    const teamId = process.env.Zentrun_APPLE_NOTARY_TEAM_ID
    const appleIdPassword = process.env.Zentrun_APPLE_NOTARY_PASSWORD

    return await notarize({
      appPath: `${appOutDir}/Zentrun.app`,
      appleId,
      appleIdPassword,
      teamId
    })
  } else {
    return await notarize({
      appPath: `${appOutDir}/Zentrun.app`,
      keychainProfile: 'Zentrun' // replace with your keychain
    })
  }
}
