import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect("mongodb+srv://user1:user123@cluster0.vb88eiu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// Models
const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    role: String, // 'adminOfAdmin', 'classAdmin', 'student'
    studentId: String,
    classId: String,
});
const User = mongoose.model('User', UserSchema);

const ClassSchema = new mongoose.Schema({
    name: String,
    adminId: String,
});
const Class = mongoose.model('Class', ClassSchema);

const AttendanceSchema = new mongoose.Schema({
    studentId: String,
    date: Date,
    status: String, // 'Present' or 'Absent'
});
const Attendance = mongoose.model('Attendance', AttendanceSchema);

const MarksSchema = new mongoose.Schema({
    studentId: String,
    subject: String,
    marks: Number,
});
const Marks = mongoose.model('Marks', MarksSchema);

const NewsSchema = new mongoose.Schema({
    title: String,
    content: String,
    date: { type: Date, default: Date.now }
});
const News = mongoose.model('News', NewsSchema);

// Routes
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'User not found' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token,user, role: user.role });
});

app.post('/api/admin/add-class', async (req, res) => {
    const { name, adminId } = req.body;
    const newClass = new Class({ name, adminId });
    await newClass.save();
    res.json({ message: 'Class added successfully' });
});

app.post('/api/admin/add-student', async (req, res) => {
    const { username, password, studentId, classId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newStudent = new User({ username, password: hashedPassword, studentId, classId, role: 'student' });
    await newStudent.save();
    res.json({ message: 'Student added successfully' });
});

app.post('/api/admin/mark-attendance', async (req, res) => {
    const { studentId, status } = req.body;
    const attendance = new Attendance({ studentId, date: new Date(), status });
    await attendance.save();
    res.json({ message: 'Attendance recorded successfully' });
});

app.post('/api/admin/add-marks', async (req, res) => {
    const { studentId, subject, marks } = req.body;
    const newMarks = new Marks({ studentId, subject, marks });
    await newMarks.save();
    res.json({ message: 'Marks added successfully' });
});

app.get('/api/student/attendance/:id', async (req, res) => {
    const attendance = await Attendance.find({ studentId: req.params.id });
    res.json(attendance);
});

app.get('/api/student/marks/:id', async (req, res) => {
    const marks = await Marks.find({ studentId: req.params.id });
    res.json(marks);
});




app.post('/api/admin/post-news', async (req, res) => {
    const { title, content } = req.body;
    const news = new News({ title, content });
    await news.save();
    res.json({ message: 'News posted successfully' });
});

app.get('/api/news', async (req, res) => {
    const news = await News.find().sort({ date: -1 });
    res.json(news);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
