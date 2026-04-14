const regForm = document.getElementById('registerForm');
const submitBtn = document.getElementById('submitBtn');

regForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>กำลังสร้างบัญชี...';

    try {
        const sendOtpRes = await fetch('/auth/request-otp', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username })
        });

        const otpData = await sendOtpRes.json();
        if (!sendOtpRes.ok || !otpData.success) {
            throw new Error(otpData.message || 'ไม่สามารถส่งอีเมลได้ กรุณาตรวจสอบอีเมลหรือรหัสผ่านแอปที่ Server');
        }

        const { value: otp, isConfirmed } = await Swal.fire({
            title: 'ยืนยันรหัส OTP',
            text: `เราได้ส่งรหัสยืนยันไปที่ ${email} แล้ว`,
            input: 'text',
            inputAttributes: { maxlength: 6, style: 'text-align: center; letter-spacing: 5px; font-size: 24px;' },
            showCancelButton: true,
            confirmButtonText: 'ยืนยันและสมัครสมาชิก',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#ffd700',
            background: '#111827',
            color: '#fff'
        });

        if (isConfirmed && otp) {
            submitBtn.innerHTML = '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>กำลังบันทึกข้อมูล...';

            const password = document.getElementById('password').value;

            const response = await fetch('/auth/register', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, otp })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'สำเร็จ!',
                    text: result.message || 'สร้างบัญชีเรียบร้อยแล้ว',
                    confirmButtonColor: '#ffd700',
                    background: '#111827',
                    color: '#fff'
                }).then(() => regForm.reset());
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'ผิดพลาด (' + response.status + ')',
                    text: result.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก',
                    background: '#111827',
                    color: '#fff'
                });
            }
        }

    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message || 'ไม่สามารถติดต่อ Server ได้',
            background: '#111827',
            color: '#fff'
        });
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'สมัครสมาชิกตอนนี้';
    }
});
