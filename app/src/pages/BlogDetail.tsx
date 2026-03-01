import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBlogPostById, getRelatedPosts } from '@/data/blog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft, Clock, Eye, Calendar, Share2,
  ChevronRight
} from 'lucide-react';
import SEO from '@/components/SEO';

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const post = id ? getBlogPostById(id) : null;
  const relatedPosts = post ? getRelatedPosts(post) : [];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">文章未找到</h1>
          <Button onClick={() => navigate('/blog')} className="bg-orange-500 hover:bg-orange-600">
            返回文章列表
          </Button>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch {
        console.log('分享取消');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
  };

  // Parse markdown-like content
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactElement[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={key++} className="text-2xl font-bold text-gray-800 mt-8 mb-4">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={key++} className="text-xl font-bold text-gray-800 mt-6 mb-3">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <li key={key++} className="ml-6 text-gray-600 leading-relaxed mb-2">
            {line.replace('- ', '')}
          </li>
        );
      } else if (line.startsWith('**') && line.endsWith('**')) {
        elements.push(
          <p key={key++} className="font-bold text-gray-800 mb-2">
            {line.replace(/\*\*/g, '')}
          </p>
        );
      } else if (line.startsWith('**Q:')) {
        elements.push(
          <div key={key++} className="bg-orange-50 p-4 rounded-xl my-4">
            <p className="font-bold text-orange-700 mb-2">{line.replace(/\*\*/g, '')}</p>
            {lines[i + 1]?.startsWith('**A:') && (
              <p className="text-gray-600">{lines[++i].replace(/\*\*/g, '').replace('A: ', '')}</p>
            )}
          </div>
        );
      } else if (line) {
        elements.push(
          <p key={key++} className="text-gray-600 leading-relaxed mb-4">
            {line}
          </p>
        );
      }
    }

    return elements;
  };

  return (
    <div className="min-h-screen bg-warm-gradient">
      <SEO
        title={`${post.title} - 宠物知识 | 宠物领养中心`}
        description={post.excerpt}
        image={post.coverImage}
        type="article"
      />
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/blog')}
              className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回文章列表
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <Badge className="mb-4 bg-orange-100 text-orange-600">
            {post.category}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {post.title}
          </h1>
          <p className="text-xl text-gray-600 mb-6">{post.excerpt}</p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span>{post.author.name}</span>
            </div>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {post.publishDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.readTime} 分钟阅读
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {post.views} 阅读
            </span>
          </div>
        </header>

        {/* Cover Image */}
        <div className="aspect-video rounded-2xl overflow-hidden mb-8">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <article className="bg-white rounded-2xl p-8 shadow-warm mb-8">
          {renderContent(post.content)}
        </article>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">相关文章</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {relatedPosts.map((relatedPost) => (
                <Card
                  key={relatedPost.id}
                  className="cursor-pointer hover:shadow-warm-lg transition-all"
                  onClick={() => navigate(`/blog/${relatedPost.id}`)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <img
                      src={relatedPost.coverImage}
                      alt={relatedPost.title}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-gray-800 line-clamp-2 mb-1">
                        {relatedPost.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {relatedPost.readTime}分钟
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">准备好领养了吗？</h2>
          <p className="mb-6 text-white/90">
            浏览我们的宠物，找到你的完美伙伴
          </p>
          <Button
            onClick={() => navigate('/pets')}
            className="bg-white text-orange-500 hover:bg-white/90 rounded-full px-8"
          >
            浏览宠物
          </Button>
        </div>
      </main>
    </div>
  );
}
