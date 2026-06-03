<template>
  <el-scrollbar class="scroll">
    <div>
      <div class="title">
        <svg class="psg-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 40" fill="none" aria-label="Panorama Scholarly Group">
          <!-- Panorama compass emblem -->
          <g transform="translate(19,20)">
            <!-- Cardinal rays -->
            <line x1="0" y1="-16" x2="0" y2="-9" stroke="#0c1c3a" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="0" y1="9" x2="0" y2="16" stroke="#0c1c3a" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="-16" y1="0" x2="-9" y2="0" stroke="#0c1c3a" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="9" y1="0" x2="16" y2="0" stroke="#0c1c3a" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Diagonal rays -->
            <line x1="-8" y1="-8" x2="-4.5" y2="-4.5" stroke="#0c1c3a" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
            <line x1="4.5" y1="-4.5" x2="8" y2="-8" stroke="#0c1c3a" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
            <line x1="4.5" y1="4.5" x2="8" y2="8" stroke="#0c1c3a" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
            <line x1="-8" y1="8" x2="-4.5" y2="4.5" stroke="#0c1c3a" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
            <!-- Outer ring -->
            <circle r="7" stroke="#0c1c3a" stroke-width="1.5"/>
            <!-- Center navy fill -->
            <circle r="5" fill="#0c1c3a"/>
            <!-- Gold centre dot -->
            <circle r="2.2" fill="#e8b520"/>
          </g>
          <!-- Separator -->
          <line x1="42" y1="6" x2="42" y2="34" stroke="#0c1c3a" stroke-width="0.8" opacity="0.3"/>
          <!-- PSG lettermark -->
          <text x="51" y="24" font-family="Georgia,'Times New Roman',Times,serif" font-size="19" font-weight="700" fill="#0c1c3a" letter-spacing="2.5">PSG</text>
          <!-- Tagline -->
          <text x="51" y="36" font-family="Arial,'Helvetica Neue',Helvetica,sans-serif" font-size="6.5" font-weight="600" fill="#0c1c3a" opacity="0.65" letter-spacing="1.8">SCHOLARLY GROUP</text>
        </svg>
      </div>
      <el-menu :collapse="false" text-color="#fff" active-text-color="#fff" style="margin-top: 10px">
        <el-menu-item @click="router.push({name: 'email'})" index="email"
                      :class="route.meta.name === 'email' ? 'choose-item' : ''">
          <Icon icon="hugeicons:mailbox-01" width="20" height="20" />
          <span class="menu-name" style="margin-left: 21px">{{$t('inbox')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'send'})" index="send" v-perm="'email:send'"
                      :class="route.meta.name === 'send' ? 'choose-item' : ''">
          <Icon icon="cil:send" width="20" height="20" />
          <span class="menu-name" style="margin-left: 21px">{{$t('sent')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'draft'})" index="draft" v-perm="'email:send'"
                      :class="route.meta.name === 'draft' ? 'choose-item' : ''">
          <Icon icon="ep:document" width="19" height="19" />
          <span class="menu-name" style="margin-left: 22px">{{$t('drafts')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'star'})" index="star"
                      :class="route.meta.name === 'star' ? 'choose-item' : ''">
          <Icon icon="solar:star-line-duotone" width="20" height="20" />
          <span class="menu-name" style="margin-left: 21px">{{$t('starred')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'setting'})" index="setting"
                      :class="route.meta.name === 'setting' ? 'choose-item' : ''">
          <Icon icon="fluent:settings-48-regular" width="20" height="20" />
          <span class="menu-name" style="margin-left: 21px">{{$t('settings')}}</span>
        </el-menu-item>
        <div class="manage-title" v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">
          <div>{{$t('manage')}}</div>
        </div>
        <el-menu-item @click="router.push({name: 'analysis'})" index="analysis" v-perm="'analysis:query'"
                      :class="route.meta.name === 'analysis' ? 'choose-item' : ''">
          <Icon icon="fluent:data-pie-20-regular" width="24" height="24" />
          <span class="menu-name" style="margin-left: 18px">{{$t('analytics')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'user'})" index="setting" v-perm="'user:query'"
                      :class="route.meta.name === 'user' ? 'choose-item' : ''">
          <Icon icon="si:user-alt-2-line" width="20" height="20" />
          <span class="menu-name" style="margin-left: 21px">{{$t('allUsers')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'all-email'})" index="all-email" v-perm="'all-email:query'"
                      :class="route.meta.name === 'all-email' ? 'choose-item' : ''">
          <Icon icon="fluent:mail-list-28-regular" width="22" height="22" />
          <span class="menu-name" style="margin-left: 20px">{{$t('allMail')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'role'})" index="setting" v-perm="'role:query'"
                      :class="route.meta.name === 'role' ? 'choose-item' : ''">
          <Icon icon="fluent:lock-closed-16-regular" width="22" height="22" />
          <span class="menu-name" style="margin-left: 20px">{{$t('permissions')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'reg-key'})" index="reg-key" v-perm="'reg-key:query'"
                      :class="route.meta.name === 'reg-key' ? 'choose-item' : ''">
          <Icon icon="fluent:fingerprint-20-filled" width="22" height="22" />
          <span class="menu-name" style="margin-left: 20px">{{$t('inviteCode')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'sys-setting'})" index="sys-setting" v-perm="'setting:query'"
                      :class="route.meta.name === 'sys-setting' ? 'choose-item' : ''">
          <Icon icon="eos-icons:system-ok-outlined" width="18" height="18" style="margin-left: 2px" />
          <span class="menu-name" style="margin-left: 22px">{{$t('SystemSettings')}}</span>
        </el-menu-item>
      </el-menu>
    </div>
  </el-scrollbar>
</template>

<script setup>
import router from "@/router/index.js";
import { useRoute } from "vue-router";
import {Icon} from "@iconify/vue";

const route = useRoute();

</script>

<style lang="scss" scoped>

.title {
  margin: 16px 12px 8px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #c8970a 0%, #e8b520 55%, #c8970a 100%);
  box-shadow: 0 4px 16px rgba(200, 151, 10, 0.35);
  transition: var(--transition-smooth);
  max-width: 236px;
  padding: 0 14px;

  .psg-logo {
    display: block;
    width: 100%;
    height: auto;
    max-width: 168px;
  }
}

.manage-title {
  margin-top: 18px;
  margin-bottom: 4px;
  padding-left: 20px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.3);
}

.el-menu-item {
  margin: 2px 10px !important;
  border-radius: 8px;
  height: 38px;
  padding: 10px !important;
  transition: background 0.15s ease;
}

.choose-item {
  font-weight: 700;
  background: var(--gold-accent-subtle) !important;
  backdrop-filter: none;
  box-shadow: inset 3px 0 0 var(--gold-accent);
  color: var(--gold-accent-light) !important;
}

@media (hover: hover) {
  .el-menu-item:hover {
    background: rgba(255, 255, 255, 0.06) !important;
  }
}

.menu-name {
  user-select: none;
  font-size: 13.5px;
  letter-spacing: 0.01em;
}

:deep(.el-scrollbar__wrap--hidden-default) {
  background: var(--aside-backgound) !important;
}

:deep(.el-menu-item) {
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
}

:deep(.el-menu) {
  background: var(--aside-backgound);
}

.el-menu {
  border-right: 0;
  width: 260px;
}

:deep(.el-divider__text) {
  background: var(--aside-backgound);
  color: #FFFFFF;
}
</style>
