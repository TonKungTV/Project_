import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert
} from 'react-native';
import { BASE_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('กรุณากรอกอีเมลและรหัสผ่าน');
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Email: email, Password: password })
            });

            const data = await res.json();

            if (res.ok) {
                const userId = data.userId; //  ดึง userId ออกมาให้ชัดเจน
                console.log('✅ Login Response:', data); // ⬅ ดูว่าได้อะไรกลับมาจริง
                await AsyncStorage.setItem('userId', data.user.id.toString());

                Alert.alert('เข้าสู่ระบบสำเร็จ');
                navigation.navigate('HomeScreen');
            }
            else {
                Alert.alert('เข้าสู่ระบบไม่สำเร็จ', data.error || 'มีบางอย่างผิดพลาด');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>เข้าสู่ระบบ</Text>

            <Text style={styles.label}>อีเมล</Text>
            <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <Text style={styles.label}>รหัสผ่าน</Text>
            <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity onPress={() => Alert.alert('ยังไม่รองรับ')}>
                <Text style={styles.forgotPassword}>ลืมรหัสผ่าน?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text>ยังไม่มีบัญชี?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('RegisterScreen')}>
                    <Text style={styles.signupLink}> สมัครสมาชิก</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 24,
        alignSelf: 'center'
    },
    label: {
        fontSize: 16,
        marginBottom: 6
    },
    input: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 16
    },
    forgotPassword: {
        color: '#007BFF',
        textAlign: 'right',
        marginBottom: 20
    },
    button: {
        backgroundColor: '#28a745',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold'
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16
    },
    signupLink: {
        color: '#007BFF',
        fontWeight: 'bold'
    }
});
