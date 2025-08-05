export interface CommunityUser {
  id: string;
  name: string;
  avatar: string;
  level: string;
  streak: number;
  isVerified: boolean;
  joinDate: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  user: CommunityUser;
  content: string;
  images?: string[];
  likes: number;
  comments: number;
  createdAt: string;
  isLiked?: boolean;
}

// 新虚拟用户数据，最高等级lv5，全部为外国网友，含头像、表情、图片
export const virtualUsers = [
  {
    id: 'v1',
    name: 'Emily Johnson',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    level: 5,
    streak: 120,
    isVerified: true,
    joinDate: '2023-01-10',
    country: 'USA'
  },
  {
    id: 'v2',
    name: 'Liam Smith',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    level: 4,
    streak: 80,
    isVerified: false,
    joinDate: '2023-03-15',
    country: 'UK'
  },
  {
    id: 'v3',
    name: 'Sofia Müller',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    level: 3,
    streak: 35,
    isVerified: false,
    joinDate: '2023-06-01',
    country: 'Germany'
  },
  {
    id: 'v4',
    name: 'Mateo García',
    avatar: 'https://randomuser.me/api/portraits/men/76.jpg',
    level: 2,
    streak: 15,
    isVerified: false,
    joinDate: '2023-08-20',
    country: 'Spain'
  },
  {
    id: 'v5',
    name: 'Ava Chen',
    avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
    level: 1,
    streak: 3,
    isVerified: false,
    joinDate: '2024-01-05',
    country: 'Singapore'
  }
]

// 评论数据结构
export interface Comment {
  id: string
  userId: string
  user: any
  content: string
  createdAt: string
  likes: number
}

export const virtualPosts = [
  {
    id: 'vp1',
    userId: 'v1',
    content: 'Day 120 of my journey! Feeling completely renewed and energized. This platform has helped me find like-minded friends who support each other. 💪',
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'],
    likes: 45,
    comments: 12,
    createdAt: '2024-01-15T10:30:00Z',
    isLiked: false
  },
  {
    id: 'vp2',
    userId: 'v2',
    content: 'It was really difficult at the beginning, but now I can control my urges much better. Persistence is the key to success! 🔥',
    images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'],
    likes: 32,
    comments: 8,
    createdAt: '2024-01-14T15:45:00Z',
    isLiked: false
  },
  {
    id: 'vp3',
    userId: 'v3',
    content: 'Sharing a tip: Whenever I feel urges, I go exercise or learn a new skill. Distracting yourself really works! 📚',
    images: ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop'],
    likes: 28,
    comments: 15,
    createdAt: '2024-01-13T09:20:00Z',
    isLiked: false
  },
  {
    id: 'vp4',
    userId: 'v4',
    content: 'New friends, don\'t rush! This is a gradual process. Give yourself time and be patient. 💙',
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'],
    likes: 19,
    comments: 6,
    createdAt: '2024-01-12T14:10:00Z',
    isLiked: false
  },
  {
    id: 'vp5',
    userId: 'v5',
    content: 'First day check-in! Hope to grow together with everyone here and break this bad habit. 🙏',
    images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'],
    likes: 15,
    comments: 4,
    createdAt: '2024-01-11T11:00:00Z',
    isLiked: false
  }
] 