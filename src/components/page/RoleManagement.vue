<template>
    <div>
        <div class="crumbs">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item>
                    <i class="el-icon-user" /> 角色管理
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
                <el-input v-model="query.searchText" placeholder="角色名" class="handle-input mr10" />
                <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
                <el-button type="primary" icon="el-icon-lx-friendadd" class="handle-del mr10" @click="handleAdd">添加新角色</el-button>
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
                <el-table-column prop="name" label="角色名" align="center" />
                <el-table-column prop="remark" label="备注" align="center" />
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
                <el-form-item label="角色名">
                    <!-- @keyup.native.enter="saveEdit" 需使用native覆盖原有封装的keyup事件即可 -->
                    <el-input v-model="editData.name" />
                </el-form-item>
                <el-form-item label="备注">
                    <el-input type="textarea" rows="5" v-model="editData.remark" />
                </el-form-item>
                <el-form-item label="权限列表">
                    <el-tree
                            ref="permissionTree"
                            :data="treeData"
                            show-checkbox
                            node-key="id"
                            default-expand-all
                            :expand-on-click-node="false">
                    </el-tree>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="resetForm('form')">取 消</el-button>
                <el-button type="primary" @click="saveEdit">确 定</el-button>
            </span>
        </el-dialog>

        <!-- 新增弹出框 -->
        <el-dialog title="新增" :visible.sync="addVisible" width="30%">
            <el-form ref="addRuleForm" status-icon :model="addData" :rules="rules" label-width="70px">
                <el-form-item label="角色名" prop="name">
                    <!-- @keyup.native.enter="saveEdit" 需使用native覆盖原有封装的keyup事件即可 -->
                    <el-input v-model="addData.name" />
                </el-form-item>
                <el-form-item label="备注" prop="remark">
                    <el-input type="textarea" rows="5" v-model="addData.remark" />
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="resetForm('addRuleForm')">取 消</el-button>
                <el-button type="primary" @click="submitAdd('addRuleForm')">确 定</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
    export default {
        name: 'roleManagement',
        data() {
            var treeData = [];
            var validateName = (rule, value, callback) => {
                // 判断value值且不是空格
                if (!value || value.split(" ").join("").length === 0) {
                    return callback(new Error('角色名不能为空'));
                    // 限制用户名只能由字母+数组组成
                }else if (!new RegExp(/^[A-Za-z0-9]+$/).test(value)){
                    return callback(new Error('角色名只能为字母+数组组成'))
                }else {
                    callback();
                }
            };
            return {
                treeData: JSON.parse(JSON.stringify(treeData)),
                props: {
                    label: 'name',
                    children: 'zones'
                },
                count: 1,
                // 分页查询数据
                query: {
                    // username查询
                    searchText: '',
                    // 当前页
                    current: 1,
                    // 每页数据大小
                    size: 10
                },
                // 表单添加数据
                addData: {
                    username: '',
                    nickName: '',
                    password: ''
                },
                rules: {
                    name: [
                        { validator: validateName, trigger: 'blur' }
                    ]
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
                // 总页数
                pageTotal: 0,
                // 选中权限列表
                checkedPermissionList: [],
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
            // 分页查询
            getData() {
                this.axios.post("/sys/role/findPage", this.query).then(
                    (response) => {
                        // console.log(response);
                        this.tableData = response.data.data.rows;
                        this.pageTotal = response.data.data.total;
                    }
                )
            },
            // 获取权限树
            getPermissionTree() {
                this.axios.get("/sys/permission/findPermissionTree").then(
                    (response) => {
                        if (response.data.status === '200'){
                            // console.log(response);
                            this.treeData = response.data.data;
                        }else {
                            console.error("获取权限树失败");
                        }
                    }
                );
            },
            // 触发搜索按钮
            handleSearch() {
                this.$set(this.query, 'current', 1);
                this.getData();
            },
            // 添加操作
            handleAdd() {
                this.addVisible = true;
            },
            // 提交添加
            submitAdd(formName) {
                this.$refs[formName].validate((valid) => {
                    if (valid) {
                        this.axios.post("sys/role/add",this.addData).then(
                            (response) => {
                                if (response.data.status === '200'){
                                    this.addVisible = false;
                                    this.resetForm(formName);
                                    // 刷新，重新获取分页数据
                                    this.getData();
                                    this.$message.success(response.data.data);
                                }else {
                                    this.$message.error(response.data.data);
                                }
                            },(error => {
                                this.$message.error('获取数据失败');
                            })
                        );
                    } else {
                        this.$message.error('请输入正确数据后重试');
                        console.error('error submit!!');
                        return false;
                    }
                });
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
                            updateStatus = this.axios.delete("/sys/role/" + row.id);
                        }else {
                            // 激活
                            updateStatus = this.axios.put("/sys/role/" + row.id);
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
                    str += this.multipleSelection[i].username + ' ';
                }
                this.$message.error(`删除了${str}`);
                this.multipleSelection = [];
            },
            // 编辑操作
            handleEdit(index, row) {
                // 获取权限树
                this.getPermissionTree();

                this.idx = index;
                this.form = row;
                // 获取用户信息
                this.axios.get("/sys/role/"+ this.form.id).then(
                    (response) => {
                        // console.log(response);
                        if (response.data.status === '200'){
                            this.editData = response.data.data;
                        }else {
                            this.$message.error(response.data.data);
                        }
                    }
                );
                // 获取角色的权限信息
                this.axios.get("/sys/role/findRolePermission/" + this.form.id).then(
                    (response) => {
                        for (var i=0; i< response.data.data.length; i++){
                            this.checkedPermissionList.push(response.data.data[i].permissionId);
                        }
                        /**
                         * default-checked-keys是初始化加载的时候用的，数据请求到的时候树组件已经加载完成了，
                         * 这时候改变default-checked-keys的值就没有用了。
                         * 需要通过this.$refs.tree.setCheckedKeys来设置选中节点
                         */
                        this.$refs.permissionTree.setCheckedKeys(this.checkedPermissionList);
                    }
                );
                this.editVisible = true;
            },
            // 保存编辑
            saveEdit() {
                // 更新用户信息
                this.axios.put("/sys/role/update", this.editData).then(
                    (response) => {
                        // console.log(response);
                        if (response.data.status === '200'){
                            this.$message.success(`修改第 ${this.idx + 1} 行成功`);
                            this.$set(this.tableData, this.idx, this.editData);
                            this.editVisible = false;
                        }else {
                            this.$message.error(response.data.data);
                        }
                    }
                );
                // 更新角色权限信息
                const updatePermissionList = [];
                // 获取选中的ID  getCheckedKeys(true) 只返回叶子节点    getCheckedKeys(false) 返回所有选中节点
                const checkedKeysList = this.$refs.permissionTree.getCheckedKeys(true);
                // console.log(checkedKeysList);
                for (var i=0; i< checkedKeysList.length; i++){
                    updatePermissionList.push({'roleId': this.editData.id, 'permissionId': checkedKeysList[i]});
                }
                this.axios.post("/sys/role/modifyRolePermission", updatePermissionList).then(
                    (response) => {
                        if (response.data.status === '200'){
                            this.$message.success(response.data.data);
                        } else {
                            this.$message.success(response.data.data);
                        }
                        // 清空角色数据
                        this.checkedPermissionList = [];
                    }
                );
            },
            // 分页导航
            handlePageChange(val) {
                this.$set(this.query, 'current', val);
                this.getData();
            },
            // 清空表单
            resetForm(formName) {
                this.addVisible = false;
                this.editVisible = false;
                this.$refs[formName].resetFields();
                // 清空权限数据
                this.checkedPermissionList = [];
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
