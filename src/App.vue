<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
.row {
  margin: 10px;
}
.col {
  margin-left: 10px;
}
.content {
  background-color: #aaa;
}
.el-table .recv-row {
  background: #bffdc3;
}
.el-table .send-row {
  background: #bfffff;
}
</style>
