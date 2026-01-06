<template>
  <div class="page">
    <div class="card">
      <h1 class="h1">404</h1>
      <p class="muted">页面不存在。</p>
      <RouterLink class="link" to="/">返回题库</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.card {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--card);
}

.h1 {
  margin: 0 0 6px;
  font-size: 18px;
}

.muted {
  color: var(--muted);
}

.link {
  display: inline-block;
  margin-top: 12px;
  color: var(--primary);
  text-decoration: none;
}
</style>

