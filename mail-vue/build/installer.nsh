; Register PSG Mail in Windows notification settings at install time
; so the app appears in Settings > System > Notifications immediately
!macro customInstall
  WriteRegDWORD HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\Notifications\Settings\com.psg.mail" "Enabled" 1
  WriteRegDWORD HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\Notifications\Settings\com.psg.mail" "ShowInActionCenter" 1
!macroend
