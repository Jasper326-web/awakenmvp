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

export const virtualPosts = [] 