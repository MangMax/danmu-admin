/**
 * 添加测试数据API
 * POST /api/test/add-sample-data
 */

import { addAnimeToStorage } from '../../utils/anime-storage';
import { addEpisodeWithId } from '../../utils/episode-storage';

export default defineEventHandler(async (_event) => {
  try {
    // 创建测试番剧数据
    const sampleAnimes: AnimeSearchResult[] = [
      {
        provider: "test" as any,
        animeId: 11111,
        bangumiId: "11111",
        animeTitle: "海贼王",
        type: "TV",
        episodeCount: 1000,
        imageUrl: "https://example.com/onepiece.jpg",
        rating: 9.2,
        startDate: "1999-10-20",
        isFavorited: true,
        typeDescription: "冒险动画"
      },
      {
        provider: "test" as any,
        animeId: 22222,
        bangumiId: "22222",
        animeTitle: "火影忍者",
        type: "TV",
        episodeCount: 720,
        imageUrl: "https://example.com/naruto.jpg",
        rating: 9.0,
        startDate: "2002-10-03",
        isFavorited: false,
        typeDescription: "忍者动画"
      },
      {
        provider: "test" as any,
        animeId: 33333,
        bangumiId: "33333",
        animeTitle: "龙珠Z",
        type: "TV",
        episodeCount: 291,
        imageUrl: "https://example.com/dbz.jpg",
        rating: 8.8,
        startDate: "1989-04-26",
        isFavorited: true,
        typeDescription: "战斗动画"
      },
      {
        provider: "test" as any,
        animeId: 44444,
        bangumiId: "44444",
        animeTitle: "鬼灭之刃",
        type: "TV",
        episodeCount: 24,
        imageUrl: "https://example.com/demon_slayer.jpg",
        rating: 9.5,
        startDate: "2019-04-06",
        isFavorited: true,
        typeDescription: "战斗动画"
      },
      {
        provider: "test" as any,
        animeId: 55555,
        bangumiId: "55555",
        animeTitle: "进击的巨人",
        type: "TV",
        episodeCount: 87,
        imageUrl: "https://example.com/aot.jpg",
        rating: 9.1,
        startDate: "2013-04-07",
        isFavorited: false,
        typeDescription: "战斗动画"
      }
    ];

    // 添加番剧到存储
    let addedAnimes = 0;
    for (const anime of sampleAnimes) {
      if (addAnimeToStorage(anime)) {
        addedAnimes++;
      }
    }

    // 添加一些集数数据
    const sampleEpisodes = [
      { id: 111111, url: "https://example.com/onepiece/ep1.mp4" },
      { id: 111112, url: "https://example.com/onepiece/ep2.mp4" },
      { id: 222221, url: "https://example.com/naruto/ep1.mp4" },
      { id: 333331, url: "https://example.com/dbz/ep1.mp4" },
      { id: 444441, url: "https://example.com/demon_slayer/ep1.mp4" },
      { id: 555551, url: "https://example.com/aot/ep1.mp4" }
    ];

    let addedEpisodes = 0;
    for (const episode of sampleEpisodes) {
      if (addEpisodeWithId(episode.id, episode.url)) {
        addedEpisodes++;
      }
    }

    return {
      success: true,
      message: `成功添加测试数据`,
      data: {
        animesAdded: addedAnimes,
        episodesAdded: addedEpisodes,
        totalSampleAnimes: sampleAnimes.length,
        totalSampleEpisodes: sampleEpisodes.length
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Failed to add sample data:', error);

    return {
      success: false,
      message: 'Failed to add sample data',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
});
