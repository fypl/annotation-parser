// 不规则目录
/* lev1 */
lev1{
	/* lev2 */
	lev2{
		/* lev3 */
		lev3{

		}
	}
	lev2-1{
		/* lev3-1 */
		lev3{

		}
	}
	lev2-2{
		lev3{
			/* lev4 */
			lev4{
				/* lev5 */
				lev5
			}
			lev4-1{
				/* lev5-1 */
				lev5
				/* lev5-2 */
				lev5-1
			}
		}
	}
}
// 规则目录
/* lev1-1 */
lev1-1{
	/* lev2-1 */
	lev2{
		/* lev3-2 */
		lev3{
			/* lev4-1 */
			lev4{
				/* lev5-3 */
				lev5
				/* lev5-4 */
				lev5-1
			}
		}
	}
	/* lev2-2 */
	lev2-1{
		/* lev3-3 */
		lev3{
		
		}
		/* lev3-4 */
		lev3-1{

		}
		/* lev3-5 */
		lev 3-2
	}
}

输出：
lev0
   |- lev1
   |     |- lev2
   |     |     |- lev3
   |     |
   |     |- lev3-1
   |     |
   |     |- lev4
   |     |     |- lev5
   |     |
   |     |- lev5-1
   |     |- lev5-2
   |
   |- lev1-1
         |- lev2-1
         |     |- lev3-2
         |           |- lev4-1
         |                 |- lev5-3
         |                 |- lev5-4
         |
         |- lev2-2
               |- lev3-3
               |- lev3-4
               |- lev3-5