; Register PSG Mail in Windows notification settings at install time
; so the app appears in Settings > System > Notifications immediately
!macro customInit
  nsExec::ExecToLog 'taskkill /IM "PSG Mail.exe" /T /F'
  Pop $0
  nsExec::ExecToLog 'taskkill /IM "psg-mail.exe" /T /F'
  Pop $0
  Sleep 1200
!macroend

!macro customInstall
  WriteRegDWORD HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\Notifications\Settings\com.psg.mail" "Enabled" 1
  WriteRegDWORD HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\Notifications\Settings\com.psg.mail" "ShowInActionCenter" 1
!macroend
