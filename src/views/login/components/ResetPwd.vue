<template>
  <div>
    <h3 text-center m-0 mb-20px>{{ t("login.resetPassword") }}</h3>
    <el-form ref="formRef" :model="model" :rules="rules" size="large">
      <!-- 用户名"-->
      <el-form-item prop="username">
        <el-input v-model.trim="model.username" :placeholder="t('login.username')">
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item>
        <Button class="w-full" @click="submit">
          {{ t("login.resetPassword") }}
        </Button>
      </el-form-item>
    </el-form>

    <div class="auth-reset__switch">
      <span class="auth-reset__switch-text">{{ t("login.thinkOfPasswd") }}</span>
      <Button variant="link" class="auth-reset__link p-0" @click="toLogin">
        {{ t("login.login") }}
      </Button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { FormInstance } from "element-plus";
import { Button } from "@/components/ui/button";

const { t } = useI18n();

const emit = defineEmits(["update:modelValue"]);
const toLogin = () => emit("update:modelValue", "login");

const model = ref({
  username: "",
});

const rules = computed(() => {
  return {
    username: [
      {
        required: true,
        trigger: "blur",
        message: t("login.message.username.required"),
      },
    ],
  };
});

const formRef = ref<FormInstance>();

const submit = async () => {
  await formRef.value?.validate();
  ElMessage.warning("开发中 ...");
};
</script>

<style scoped lang="scss">
.auth-reset__switch {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
}

.auth-reset__switch-text {
  color: var(--el-text-color-regular);
}

.auth-reset__link {
  height: auto;
  font-size: 0.875rem;
}
</style>
