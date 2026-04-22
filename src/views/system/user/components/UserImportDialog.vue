<template>
  <div>
    <el-dialog
      v-model="visible"
      :align-center="true"
      title="导入数据"
      width="600px"
      class="user-import-dialog"
      @close="closeDialog"
    >
      <el-scrollbar max-height="60vh">
        <el-form
          ref="importFormRef"
          :model="importFormData"
          :rules="importFormRules"
          class="user-import-dialog__form"
        >
          <el-form-item label="文件" prop="files" class="user-import-dialog__form-item">
            <el-upload
              ref="uploadRef"
              v-model:file-list="importFormData.files"
              class="w-full"
              accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              :drag="true"
              :limit="1"
              :auto-upload="false"
              :on-exceed="handleFileExceed"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或
                <em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip user-import-dialog__tip">
                  格式为 *.xlsx / *.xls，文件不超过1M
                  <Button variant="link" class="p-0" @click="downloadTemplate">下载模板</Button>
                </div>
              </template>
            </el-upload>
          </el-form-item>
        </el-form>
      </el-scrollbar>
      <template #footer>
        <div class="dialog-footer">
          <Button v-if="resultData.length > 0" variant="outline" @click="showResult">
            错误信息
          </Button>
          <Button :disabled="importFormData.files.length === 0" @click="handleUpload">确定</Button>
          <Button variant="outline" @click="closeDialog">取消</Button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="resultVisible" title="导入结果" width="600px">
      <el-alert
        :title="`导入结果：${invalidCount}条无效数据，${validCount}条有效数据`"
        type="warning"
        :closable="false"
      />
      <el-table :data="resultData" style="width: 100%; max-height: 400px">
        <el-table-column prop="index" align="center" width="100" type="index" label="序号" />
        <el-table-column prop="message" label="错误信息" width="400">
          <template #default="scope">
            {{ scope.row }}
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <div class="dialog-footer">
          <Button variant="outline" @click="closeResultDialog">关闭</Button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage, type UploadUserFile } from "element-plus";
import UserAPI from "@/api/system/user";
import { Button } from "@/components/ui/button";
import { ApiCodeEnum } from "@/enums/api";
import { downloadFile } from "@/utils/download";

const emit = defineEmits(["import-success"]);

// 弹窗可见状态
const visible = defineModel("modelValue", {
  type: Boolean,
  required: true,
  default: false,
});

// 结果弹窗状态
const resultVisible = ref(false);
const resultData = ref<string[]>([]);
const invalidCount = ref(0);
const validCount = ref(0);

// 表单引用
const importFormRef = ref(null);
const uploadRef = ref(null);

// 表单数据
const importFormData = reactive<{
  files: UploadUserFile[];
}>({
  files: [],
});

// 验证规则
const importFormRules = {
  files: [{ required: true, message: "文件不能为空", trigger: "blur" }],
};

watch(visible, (newValue) => {
  if (newValue) {
    resultData.value = [];
    resultVisible.value = false;
    invalidCount.value = 0;
    validCount.value = 0;
  }
});

/**
 * 文件超出个数限制
 */
function handleFileExceed(): void {
  ElMessage.warning("只能上传一个文件");
}

/**
 * 下载导入模板
 */
function downloadTemplate(): void {
  UserAPI.downloadTemplate().then((response: any) => {
    downloadFile(response);
  });
}

/**
 * 上传文件
 */
async function handleUpload(): Promise<void> {
  if (!importFormData.files.length) {
    ElMessage.warning("请选择文件");
    return;
  }

  const result = await UserAPI.import(importFormData.files[0].raw as File);
  if (result.code === ApiCodeEnum.SUCCESS && result.invalidCount === 0) {
    ElMessage.success("导入成功，导入数据：" + result.validCount + "条");
    emit("import-success");
    closeDialog();
  } else {
    ElMessage.error("上传失败");
    resultVisible.value = true;
    resultData.value = result.messageList;
    invalidCount.value = result.invalidCount;
    validCount.value = result.validCount;
  }
}

/**
 * 显示错误信息
 */
function showResult(): void {
  resultVisible.value = true;
}

/**
 * 关闭错误信息弹窗
 */
function closeResultDialog(): void {
  resultVisible.value = false;
}

/**
 * 关闭弹窗
 */
function closeDialog(): void {
  importFormData.files.length = 0;
  visible.value = false;
}
</script>

<style scoped lang="scss">
.user-import-dialog :deep(.el-dialog) {
  border-radius: 24px;
}

.user-import-dialog :deep(.el-dialog .el-form-item__label) {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--muted-foreground);
  letter-spacing: 0.04em;
}

.user-import-dialog__form {
  padding-right: var(--el-dialog-padding-primary);
}

.user-import-dialog__form-item {
  padding: 16px;
  background: color-mix(in srgb, var(--card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 88%, transparent);
  border-radius: 18px;
}

.user-import-dialog__tip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
</style>
