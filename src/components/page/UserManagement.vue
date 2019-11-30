<template>
    <div>
        <div class="crumbs">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item>
                    <i class="el-icon-user" /> 用户管理
                </el-breadcrumb-item>
            </el-breadcrumb>
        </div>
        <div class="container">
            <div class="handle-box">
                <el-button
                        type="primary"
                        icon="el-icon-delete"
                        class="handle-del mr10"
                        @click="delAllSelection"
                >批量删除</el-button>
                <el-input v-model="query.searchText" placeholder="用户名" class="handle-input mr10" />
                <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
                <el-button type="primary" icon="el-icon-lx-friendadd" class="handle-del mr10" @click="handleAdd">添加新用户</el-button>
            </div>
            <el-table
                    :data="tableData"
                    border
                    class="table"
                    ref="multipleTable"
                    header-cell-class-name="table-header"
                    @selection-change="handleSelectionChange"
            >
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column prop="id" label="ID" width="200" align="center" />
                <el-table-column prop="nickName" label="昵称" width="150" align="center" />
                <el-table-column prop="username" label="用户名" width="100" align="center" />
                <el-table-column prop="password" label="密码" width="300" align="center" />
                <el-table-column prop="email" label="邮箱" width="250" align="center" />
                <el-table-column label="状态" width="100" align="center">
                    <template slot-scope="scope">
                        <el-tag
                                :type="scope.row.status ? 'success': 'danger'"
                        >{{scope.row.status ? "激活":"冻结"}}</el-tag>
                    </template>
                </el-table-column>

                <el-table-column prop="createTime" label="注册时间" align="center" />
                <el-table-column label="操作" width="180" align="center">
                    <template slot-scope="scope">
                        <el-button
                                type="text"
                                icon="el-icon-edit"
                                @click="handleEdit(scope.$index, scope.row)"
                        >编辑</el-button>
                        <el-button
                                type="text"
                                icon="el-icon-delete"
                                class="red"
                                @click="handleDelete(scope.$index, scope.row)"
                        >{{ scope.row.status ? "冻结":"激活" }}</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="pagination">
                <el-pagination
                        background
                        layout="total, prev, pager, next"
                        :current-page="query.current"
                        :page-size="query.size"
                        :total="pageTotal"
                        @current-change="handlePageChange"
                />
            </div>
        </div>

        <!-- 编辑弹出框 -->
        <el-dialog title="编辑" :visible.sync="editVisible" width="30%">
            <el-form ref="form" :model="editData" label-width="70px">
                <el-form-item label="昵称">
                    <!-- @keyup.native.enter="saveEdit" 需使用native覆盖原有封装的keyup事件即可 -->
                    <el-input @keyup.native.enter="saveEdit" v-model="editData.nickName" />
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="editVisible = false">取 消</el-button>
                <el-button type="primary" @click="saveEdit">确 定</el-button>
            </span>
        </el-dialog>

        <!-- 编辑新增框 -->
        <el-dialog title="新增" :visible.sync="addVisible" width="30%">
            <el-form ref="form" :model="addData" label-width="70px">
                <el-form-item label="用户名">
                    <el-input v-model="addData.username" />
                </el-form-item>
                <el-form-item label="昵称">
                    <el-input v-model="addData.nickName" />
                </el-form-item>
                <el-form-item label="密码">
                    <el-input type="password" v-model="addData.password" />
                </el-form-item>
                <el-form-item label="邮箱">
                    <el-input type="email" v-model="addData.email" />
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="addVisible = false">取 消</el-button>
                <el-button type="primary" @click="saveEdit">确 定</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
    export default {
        name: 'userManagement',
        data() {
            return {
                query: {
                    // username查询
                    searchText: '',
                    // 当前页
                    current: 1,
                    // 每页数据大小
                    size: 2
                },
                // 表格数据
                tableData: [],
                multipleSelection: [],
                delList: [],
                // 是否显示编辑框
                editVisible: false,
                // 编辑数据
                editData:{},
                // 是否显示新增框
                addVisible: false,
                addData:{},
                // 总页数
                pageTotal: 0,
                // 一行数据
                form: {},
                // 本行id
                idx: -1,
                id: -1
            };
        },
        created() {
            this.getData();
        },
        methods: {
            // 获取 easy-mock 的模拟数据
            getData() {
                this.axios.post("/sys/user/findPage", this.query).then(
                    (response) => {
                        console.log(response);
                        this.tableData = response.data.data.rows;
                        this.pageTotal = response.data.data.total;
                    }
                )
            },
            // 触发搜索按钮
            handleSearch() {
                this.$set(this.query, 'current', 1);
                this.getData();
            },
            handleAdd() {

                this.addVisible = true;
            },
            // 删除操作
            handleDelete(index, row) {
                // 二次确认删除
                this.$confirm('确定要'+ (row.status ? '冻结':'激活') +'吗？', '提示', {
                    type: 'warning'
                })
                    // 点击确定执行事件
                    .then(() => {
                        let updateStatus;
                        if (row.status){
                            // 冻结
                            updateStatus = this.axios.delete("/sys/user/" + row.id);
                        }else {
                            // 激活
                            updateStatus = this.axios.put("/sys/user/" + row.id);
                        }
                        updateStatus.then(
                            (response) => {
                                if (response.data.status === '200'){
                                    this.$message.success(response.data.data);
                                    this.getData();
                                    // this.tableData.splice(index, 1);
                                }else {
                                    this.$message.error(response.data.data);
                                }
                            }
                        );
                    })
                    // 点击取消执行事件
                    .catch(() => {});
            },
            // 多选操作
            handleSelectionChange(val) {
                this.multipleSelection = val;
            },
            delAllSelection() {
                const length = this.multipleSelection.length;
                let str = '';
                this.delList = this.delList.concat(this.multipleSelection);
                for (let i = 0; i < length; i++) {
                    str += this.multipleSelection[i].name + ' ';
                }
                this.$message.error(`删除了${str}`);
                this.multipleSelection = [];
            },
            // 编辑操作
            handleEdit(index, row) {
                this.idx = index;
                this.form = row;
                // console.log(index);
                // console.log(row);
                this.axios.get("/sys/user/"+ this.form.id).then(
                    (response) => {
                        console.log(response);
                        if (response.data.status === '200'){
                            this.editData = response.data.data;
                        }else {
                            this.$message.error(response.data.data);
                        }
                    }
                );
                this.editVisible = true;
            },
            // 保存编辑
            saveEdit() {
                this.axios.put("/sys/user/update", this.editData).then(
                    (response) => {
                        console.log(response);
                        if (response.data.status === '200'){
                            this.$message.success(`修改第 ${this.idx + 1} 行成功`);
                            this.$set(this.tableData, this.idx, this.editData);
                            this.editVisible = false;
                        }else {
                            this.$message.error(response.data.data);
                        }
                    }
                );
            },
            // 分页导航
            handlePageChange(val) {
                this.$set(this.query, 'current', val);
                this.getData();
            }
        }
    };
</script>

<style scoped>
    .handle-box {
        margin-bottom: 20px;
    }

    .handle-select {
        width: 120px;
    }

    .handle-input {
        width: 300px;
        display: inline-block;
    }
    .table {
        width: 100%;
        font-size: 14px;
    }
    .red {
        color: #ff0000;
    }
    .mr10 {
        margin-right: 10px;
    }
    .table-td-thumb {
        display: block;
        margin: auto;
        width: 40px;
        height: 40px;
    }
</style>
