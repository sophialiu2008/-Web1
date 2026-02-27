import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogPosts } from '@/data/blog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ImageFallback } from '@/components/ui/image-fallback';
import { Search, Clock, Eye, ArrowRight, Calendar } from 'lucide-react';

const categories = ['全部', '养猫指南', '狗狗训练', '领养指南', '宠物健康'];

export default function Blog() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');

  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch =
      searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === '全部' || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-warm-gradient">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">宠物知识</h1>
          <p className="text-gray-600 max-w-2xl">
            专业的养宠指南、训练技巧和领养知识，帮助你成为更好的宠物主人
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="搜索文章..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 rounded-full"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === category
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-orange-50'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Post */}
        {!searchQuery && selectedCategory === '全部' && (
          <div className="mb-12">
            <Card
              className="overflow-hidden cursor-pointer hover:shadow-warm-lg transition-all"
              onClick={() => navigate(`/blog/${blogPosts[0].id}`)}
            >
              <div className="grid md:grid-cols-2">
                <div className="aspect-video md:aspect-auto overflow-hidden relative group">
                  <ImageFallback
                    src={blogPosts[0].coverImage}
                    alt={blogPosts[0].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-8 flex flex-col justify-center bg-white/50">
                  <Badge className="w-fit mb-4 bg-orange-100 text-orange-600">
                    {blogPosts[0].category}
                  </Badge>
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    {blogPosts[0].title}
                  </h2>
                  <p className="text-gray-600 mb-4">{blogPosts[0].excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {blogPosts[0].publishDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {blogPosts[0].readTime} 分钟阅读
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {blogPosts[0].views}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src={blogPosts[0].author.avatar}
                      alt={blogPosts[0].author.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm text-gray-600">
                      {blogPosts[0].author.name}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Posts Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card
              key={post.id}
              className="overflow-hidden cursor-pointer hover:shadow-warm-xl border-gray-100 transition-all duration-300 group hover:-translate-y-1"
              onClick={() => navigate(`/blog/${post.id}`)}
            >
              <div className="aspect-video overflow-hidden relative">
                <ImageFallback
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <CardContent className="p-6 bg-white">
                <Badge className="mb-2 bg-orange-100 text-orange-600">
                  {post.category}
                </Badge>
                <h3 className="font-bold text-gray-800 mb-2 group-hover:text-orange-500 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}分钟
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {post.views}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              没有找到相关文章
            </h3>
            <p className="text-gray-500">试试其他搜索词或分类</p>
          </div>
        )}
      </main>
    </div>
  );
}
