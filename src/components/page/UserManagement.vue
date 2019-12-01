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
                    <el-input v-model="editData.nickName" />
                </el-form-item>
                <el-form-item
                        prop="email"
                        label="邮箱"
                        :rules="[
                                  { required: true, message: '请输入邮箱地址', trigger: 'blur' },
                                  { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
                                ]"
                >
                    <el-input v-model="editData.email" />
                </el-form-item>
                <el-form-item label="角色列表">
                    <el-checkbox-group v-model="checkedRoleList">
                        <el-checkbox-button v-for="item in roleList" :label="item.id">{{ item.name }}</el-checkbox-button>
                    </el-checkbox-group>
                </el-form-item>
<!--                <el-form-item label="账号状态">-->
<!--                    <el-radio-group v-model="editData.status">-->
<!--                        <el-radio :label="false">冻结</el-radio>-->
<!--                        <el-radio :label="true">激活</el-radio>-->
<!--                    </el-radio-group>-->
<!--                </el-form-item>-->
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="resetForm('form')">取 消</el-button>
                <el-button type="primary" @click="saveEdit">确 定</el-button>
            </span>
        </el-dialog>

        <!-- 新增弹出框 -->
        <el-dialog title="新增" :visible.sync="addVisible" width="30%">
            <el-form ref="addRuleForm" status-icon :model="addData" :rules="rules" label-width="70px">
                <el-form-item label="用户名" prop="username">
                    <el-input v-model="addData.username" />
                </el-form-item>
                <el-form-item label="昵称" prop="nickName">
                    <el-input v-model="addData.nickName" />
                </el-form-item>
                <el-form-item label="密码" prop="password">
                    <el-input type="password" v-model="addData.password" />
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
        name: 'userManagement',
        data() {
            var validateUsername = (rule, value, callback) => {
                // 判断value值且不是空格
                if (!value || value.split(" ").join("").length === 0) {
                    return callback(new Error('用户名不能为空'));
                    // 限制用户名只能由字母+数组组成
                }else if (!new RegExp(/^[A-Za-z0-9]+$/).test(value)){
                    return callback(new Error('用户名只能为字母+数组组成'))
                }
                setTimeout(() => {
                    // 验证用户名是否存在
                    this.axios.get("/sys/user/exists?username=" + this.addData.username).then(
                        (response) => {
                            // callback(new Error("OK"));
                            // console.log(response);
                            if (response.data.status !== '200') {
                                callback(new Error('用户名已存在'));
                            }else {
                                callback();
                            }
                        },(error => {
                            callback(new Error("系统错误，请稍后重试！"));
                        })
                    );
                }, 500);
            };
            var validateNickName = (rule, value, callback) => {
                if (!value) {
                    callback(new Error('请输入昵称'));
                } else if(value.length > 6) {
                    callback(new Error('最多输入6位'));
                } else if (value.split(" ").join("").length === 0){
                    callback(new Error('不能全为空格'));
                } else {
                    callback();
                }
            };
            var validatePassword = (rule, value, callback) => {
                if (!value || value.split(" ").join("").length === 0) {
                    callback(new Error('请输入密码'));
                } else if(new RegExp("[` ~!#$^&*()=|{}':;',\\[\\]<>《》/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]").test(value)){
                    callback(new Error('不允许带有特殊字符'));
                } else if (value.length < 6) {
                    callback(new Error('请输入最少6位密码'));
                } else if(value.length > 16){
                    callback(new Error('最大输入16位'));
                } else {
                    callback();
                }
            };
            return {
                // 分页查询数据
                query: {
                    // username查询
                    searchText: '',
                    // 当前页
                    current: 1,
                    // 每页数据大小
                    size: 5
                },
                // 表单添加数据
                addData: {
                    username: '',
                    nickName: '',
                    password: ''
                },
                rules: {
                    username: [
                        { validator: validateUsername, trigger: 'blur' }
                    ],
                    nickName: [
                        { validator: validateNickName, trigger: 'blur' }
                    ],
                    password: [
                        { validator: validatePassword, trigger: 'blur' }
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
                // 角色列表
                roleList: [],
                // 选择角色列表
                checkedRoleList: [],
                // 一行数据
                form: {},
                // 本行id
                idx: -1,
                id: -1
            };
        },
        created() {
            this.getData();
            this.getRole();
        },
        methods: {
            // 分页查询
            getData() {
                this.axios.post("/sys/user/findPage", this.query).then(
                    (response) => {
                        // console.log(response);
                        this.tableData = response.data.data.rows;
                        this.pageTotal = response.data.data.total;
                    }
                )
            },
            // 查询角色表所有数据
            getRole() {
                this.axios.get("/sys/role/list").then(
                    (response) => {
                        if (response.data.status === '200'){
                            // console.log(response.data.data);
                            this.roleList = response.data.data;
                        } else {
                            console.error("获取角色列表失败！");
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
                        this.axios.post("sys/user/add",this.addData).then(
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
                    str += this.multipleSelection[i].username + ' ';
                }
                this.$message.error(`删除了${str}`);
                this.multipleSelection = [];
            },
            // 编辑操作
            handleEdit(index, row) {
                this.idx = index;
                this.form = row;
                // 获取用户信息
                this.axios.get("/sys/user/"+ this.form.id).then(
                    (response) => {
                        // console.log(response);
                        if (response.data.status === '200'){
                            this.editData = response.data.data;
                        }else {
                            this.$message.error(response.data.data);
                        }
                    }
                );
                // 获取用户的角色信息
                this.axios.get("/sys/user/findUserRole/" + this.form.id).then(
                    (response) => {
                        // this.checkedRoleList = response.data.data;
                        for (var i=0; i< response.data.data.length; i++){
                            this.checkedRoleList.push(response.data.data[i].roleId);
                        }
                        // console.log(this.checkedRoleList);
                    }
                );
                this.editVisible = true;
            },
            // 保存编辑
            saveEdit() {
                // 更新用户信息
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
                // 更新用户角色信息
                const updateRoleList = [];
                for (var i=0; i< this.checkedRoleList.length; i++){
                    updateRoleList.push({'userId': this.editData.id, 'roleId': this.checkedRoleList[i]});
                }
                this.axios.post("/sys/user/modifyUserRole", updateRoleList).then(
                    (response) => {
                        if (response.data.status === '200'){
                            this.$message.success(response.data.data);
                        } else {
                            this.$message.success(response.data.data);
                        }
                        // 清空角色数据
                        this.checkedRoleList = [];
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
                // 清空角色数据
                this.checkedRoleList = [];
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
